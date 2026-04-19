import { createWebSocketServer } from '../ws/server.js';
import { createRoutes } from '../api/routes.js';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { networkInterfaces } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export interface CLIOptions {
  port?: number;
  host?: string;
  webDistPath?: string;
  corsOrigin?: string;
  apiKey?: string;
}

export async function start(options: CLIOptions = {}) {
  const port = options.port || 38291;
  const host = options.host; // 用户指定的公网地址（域名或 IP）
  const corsOrigin = options.corsOrigin || process.env.OPENLOG_CORS_ORIGIN;
  const apiKey = options.apiKey || process.env.OPENLOG_API_KEY;

  const app = express();
  const server = http.createServer(app);

  app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((s) => s.trim()) } : undefined));

  // Optional API key authentication middleware
  if (apiKey) {
    app.use((req, res, next) => {
      // Skip auth for static files
      if (!req.path.startsWith('/api/')) return next();
      const provided = req.headers['x-api-key'] || req.query['apiKey'];
      if (provided !== apiKey) {
        return res.status(401).json({ error: 'Unauthorized: invalid API key' });
      }
      next();
    });
  }

  const {
    deviceStore,
    logStore,
    networkStore,
    storageStore,
    domStore,
    performanceStore,
    screenshotStore,
    perfRunStore,
    mockStore,
  } = createWebSocketServer(server, { apiKey });
  app.use(express.json({ limit: '5mb' })); // screenshots can be large, but cap at 5MB
  app.use(
    createRoutes(
      deviceStore,
      logStore,
      networkStore,
      storageStore,
      domStore,
      performanceStore,
      screenshotStore,
      perfRunStore,
      mockStore,
    ),
  );

  // 获取当前文件的目录路径
  const currentFilename = fileURLToPath(import.meta.url);
  const currentDirname = dirname(currentFilename);

  // 提供静态文件：优先使用传入的路径，否则回退到 monorepo 中 web/dist（开发模式）
  const webDistPath = options.webDistPath ?? join(currentDirname, '../../../web/dist');
  app.use(express.static(webDistPath));

  // 全局异常处理
  const handleError = (error: Error, context: string) => {
    console.error(`[${context}]`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  };

  process.on('uncaughtException', (error) => {
    handleError(error, 'uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    handleError(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledRejection');
  });

  // 进程信号处理
  const shutdown = async (signal: string) => {
    console.log(`\n收到 ${signal} 信号，正在关闭服务器...`);

    try {
      // 关闭 HTTP 服务器
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log('服务器已关闭');
      process.exit(0);
    } catch (error) {
      console.error('关闭服务器时出错:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // 启动服务器，添加错误处理
  await new Promise<void>((resolve, reject) => {
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`端口 ${port} 已被占用，请使用其他端口或关闭占用该端口的程序`));
      } else {
        reject(new Error(`服务器启动失败: ${error.message}`));
      }
    });

    server.listen(port, '0.0.0.0', () => {
      // 列出所有可用的 IPv4 地址（跳过 loopback）
      const allIpv4 = Object.entries(networkInterfaces()).flatMap(([name, ifaces]) =>
        (ifaces ?? [])
          .filter((i) => i.family === 'IPv4' && !i.internal)
          .map((i) => ({ name, address: i.address })),
      );

      const localUrl = `http://localhost:${port}`;

      // 如果用户指定了 --host，优先使用（云端/公网场景）
      const useHost = host;
      const protocol = useHost?.startsWith('https') ? 'wss' : 'ws';
      const httpProtocol = useHost?.startsWith('https') ? 'https' : 'http';

      // 构建网络地址列表行
      const networkLines =
        allIpv4.length > 0
          ? allIpv4
              .map(({ name, address }) => {
                const url = `http://${address}:${port}`;
                const wsUrl = `ws://${address}:${port}`;
                return `  ${name.padEnd(12)} ${url}\n` + `               SDK server: '${wsUrl}'`;
              })
              .join('\n')
          : '  （未检测到局域网地址）';

      // 确定 SDK snippet 中使用的 server 地址
      let primaryWs: string;
      let panelUrl: string;
      if (useHost) {
        // 云端模式：用户指定了公网地址
        const cleanHost = useHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const needsPort = !cleanHost.includes(':');
        primaryWs = `${protocol}://${cleanHost}${needsPort && port !== 80 && port !== 443 ? ':' + port : ''}`;
        panelUrl = `${httpProtocol}://${cleanHost}${needsPort && port !== 80 && port !== 443 ? ':' + port : ''}`;
      } else {
        // 局域网模式：自动检测 IP
        const primaryIp = allIpv4[0]?.address ?? 'localhost';
        primaryWs = `ws://${primaryIp}:${port}`;
        panelUrl = localUrl;
      }

      console.log(`
┌─────────────────────────────────────────────────────┐
│              openLog  已启动 🚀                      │
├─────────────────────────────────────────────────────┤
│  PC 监控面板                                         │
│    本机:   ${localUrl}
${
  useHost
    ? `│    公网:   ${panelUrl}`
    : `│  局域网（所有可用网卡）：\n${networkLines
        .split('\n')
        .map((l) => `│    ${l}`)
        .join('\n')}`
}
├─────────────────────────────────────────────────────┤
│  SDK 接入（复制以下代码到 H5 页面）                   │
│                                                     │
│  <script src="https://unpkg.com/@openlog/sdk@latest  │
│    /dist/openlog.iife.js"></script>                 │
│  <script>                                           │
│    OpenLog.init({                                   │
│      projectId: 'my-app',                           │
│      server: '${primaryWs}',
│      lang: 'zh'                                     │
│    })                                               │
│  </script>                                         │
│                                                     │
${
  useHost
    ? `│  ✅ 已配置公网地址，任何网络下的设备均可连接          │`
    : `│  ⚠️  手机与电脑不在同一 WiFi？                        │\n│     从上方局域网列表选择手机可达的网卡地址替换 server │`
}
├─────────────────────────────────────────────────────┤
│  MCP 配置（AI 工具接入）                             │
│    运行: npx @openlog/cli init  自动写入 MCP 配置     │
└─────────────────────────────────────────────────────┘
  按 Ctrl+C 停止   端口: ${port}   (切换端口: npx @openlog/cli -p <port>)
`);

      resolve();
    });
  });

  return server;
}
