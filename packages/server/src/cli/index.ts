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
}

export async function start(options: CLIOptions = {}) {
  const port = options.port || 38291;

  const app = express();
  const server = http.createServer(app);

  app.use(cors());

  const { deviceStore, logStore, networkStore, storageStore, domStore, performanceStore, screenshotStore, perfRunStore } = createWebSocketServer(server);
  app.use(express.json({ limit: '10mb' })); // screenshots are large
  app.use(createRoutes(deviceStore, logStore, networkStore, storageStore, domStore, performanceStore, screenshotStore, perfRunStore));

  // 获取当前文件的目录路径
  const currentFilename = fileURLToPath(import.meta.url);
  const currentDirname = dirname(currentFilename);

  // 提供静态文件：指向 web 包的 dist 目录
  // 从 packages/server/dist/cli/ 向上三级到 packages/，然后进入 web/dist
  const webDistPath = join(currentDirname, '../../../web/dist');
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
    handleError(
      reason instanceof Error ? reason : new Error(String(reason)),
      'unhandledRejection'
    );
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
      const allIpv4 = Object.entries(networkInterfaces())
        .flatMap(([name, ifaces]) =>
          (ifaces ?? [])
            .filter(i => i.family === 'IPv4' && !i.internal)
            .map(i => ({ name, address: i.address }))
        );

      const localUrl = `http://localhost:${port}`;

      // 构建网络地址列表行
      const networkLines = allIpv4.length > 0
        ? allIpv4.map(({ name, address }) => {
            const url = `http://${address}:${port}`;
            const wsUrl = `ws://${address}:${port}`;
            return (
              `  ${name.padEnd(12)} ${url}\n` +
              `               SDK server: '${wsUrl}'`
            );
          }).join('\n')
        : '  （未检测到局域网地址）';

      // CDN snippet 用第一个 IP（最常用的），若无则用 localhost
      const primaryIp = allIpv4[0]?.address ?? 'localhost';
      const primaryWs = `ws://${primaryIp}:${port}`;

      console.log(`
┌─────────────────────────────────────────────────────┐
│              openLog  已启动 🚀                      │
├─────────────────────────────────────────────────────┤
│  PC 监控面板                                         │
│    本机:   ${localUrl}
│  局域网（所有可用网卡）：
${networkLines.split('\n').map(l => `│    ${l}`).join('\n')}
├─────────────────────────────────────────────────────┤
│  SDK 接入（选择上方对应网络的 server 地址粘贴）       │
│                                                     │
│  <script src="https://unpkg.com/openlog@latest      │
│    /dist/openlog.iife.js"></script>                 │
│  <script>                                           │
│    OpenLog.init({                                   │
│      projectId: 'my-app',                           │
│      server: '${primaryWs}',
│      lang: 'zh'                                     │
│    })                                               │
│  </script>                                         │
│                                                     │
│  ⚠️  手机与电脑不在同一 WiFi？                        │
│     从上方局域网列表选择手机可达的网卡地址替换 server │
├─────────────────────────────────────────────────────┤
│  MCP 配置（AI 工具接入）                             │
│    运行: npx openlog init  自动写入 MCP 配置         │
└─────────────────────────────────────────────────────┘
  按 Ctrl+C 停止   端口: ${port}   (切换端口: openlog -p <port>)
`);

      resolve();
    });
  });

  return server;
}
