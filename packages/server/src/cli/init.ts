import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { networkInterfaces } from 'os';

export interface InitOptions {
  forTool?: string;
}

interface AIToolConfig {
  name: string;
  configPath: string;
  detect: () => boolean;
  write: (mcpEntry: object, port: number) => void;
}

function getNetworkIp(): string {
  const iface = Object.values(networkInterfaces())
    .flat()
    .find(i => i?.family === 'IPv4' && !i.internal);
  return iface?.address ?? 'localhost';
}

function getAllIpv4(): { name: string; address: string }[] {
  return Object.entries(networkInterfaces())
    .flatMap(([name, ifaces]) =>
      (ifaces ?? [])
        .filter(i => i.family === 'IPv4' && !i.internal)
        .map(i => ({ name, address: i.address }))
    );
}

function getMcpEntry(port: number) {
  return {
    command: 'node',
    args: [resolve(new URL(import.meta.url).pathname, '../../../mcp/dist/index.js')],
    env: {
      OPENLOG_API_BASE_URL: `http://localhost:${port}`
    }
  };
}

const AI_TOOLS: AIToolConfig[] = [
  {
    name: 'Claude Code',
    configPath: '.claude.json',
    detect: () => existsSync(join(process.cwd(), '.claude.json')) || existsSync(join(process.cwd(), '.claude')),
    write(mcpEntry, port) {
      const configFile = join(process.cwd(), '.claude.json');
      const config = existsSync(configFile)
        ? JSON.parse(readFileSync(configFile, 'utf-8'))
        : {};
      config.mcpServers = config.mcpServers ?? {};
      config.mcpServers.openlog = mcpEntry;
      writeFileSync(configFile, JSON.stringify(config, null, 2));
      console.log(`  ✅ 已写入 .claude.json`);
    }
  },
  {
    name: 'Cursor',
    configPath: '.cursor/mcp.json',
    detect: () => existsSync(join(process.cwd(), '.cursor')),
    write(mcpEntry, _port) {
      const configDir = join(process.cwd(), '.cursor');
      const configFile = join(configDir, 'mcp.json');
      mkdirSync(configDir, { recursive: true });
      const config = existsSync(configFile)
        ? JSON.parse(readFileSync(configFile, 'utf-8'))
        : {};
      config.mcpServers = config.mcpServers ?? {};
      config.mcpServers.openlog = mcpEntry;
      writeFileSync(configFile, JSON.stringify(config, null, 2));
      console.log(`  ✅ 已写入 .cursor/mcp.json`);
    }
  },
  {
    name: 'Windsurf',
    configPath: '~/.codeium/windsurf/mcp_config.json',
    detect: () => {
      const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
      return existsSync(join(home, '.codeium', 'windsurf'));
    },
    write(mcpEntry, _port) {
      const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
      const configFile = join(home, '.codeium', 'windsurf', 'mcp_config.json');
      mkdirSync(join(home, '.codeium', 'windsurf'), { recursive: true });
      const config = existsSync(configFile)
        ? JSON.parse(readFileSync(configFile, 'utf-8'))
        : {};
      config.mcpServers = config.mcpServers ?? {};
      config.mcpServers.openlog = mcpEntry;
      writeFileSync(configFile, JSON.stringify(config, null, 2));
      console.log(`  ✅ 已写入 ~/.codeium/windsurf/mcp_config.json`);
    }
  }
];

export async function init(options: InitOptions = {}) {
  const port = parseInt(process.env.OPENLOG_PORT ?? '38291', 10);
  const networkIp = getNetworkIp();
  const mcpEntry = getMcpEntry(port);

  console.log('\n🔍 openLog init — 自动配置 MCP\n');

  // 确定要配置哪些工具
  let targets: AIToolConfig[] = [];

  if (options.forTool) {
    const name = options.forTool.toLowerCase();
    const found = AI_TOOLS.find(t => t.name.toLowerCase().includes(name));
    if (!found) {
      console.error(`  ❌ 未知 AI 工具: ${options.forTool}`);
      console.log(`  支持: ${AI_TOOLS.map(t => t.name).join(' | ')}`);
      process.exit(1);
    }
    targets = [found];
  } else {
    // 自动检测
    targets = AI_TOOLS.filter(t => t.detect());
    if (targets.length === 0) {
      console.log('  ⚠️  未检测到已安装的 AI 工具，将显示手动配置方法。\n');
      printManualConfig(mcpEntry, port);
      return;
    }
    console.log(`  检测到: ${targets.map(t => t.name).join(', ')}\n`);
  }

  // 写入配置
  for (const tool of targets) {
    console.log(`  配置 ${tool.name}...`);
    tool.write(mcpEntry, port);
  }

  // 列出所有可用网卡地址
  const allIps = getAllIpv4();
  const primaryIp = allIps[0]?.address ?? 'localhost';
  const networkIpLines = allIps.length > 0
    ? allIps.map(({ name, address }) => `    ${name.padEnd(12)} ws://${address}:${port}`).join('\n')
    : '    （未检测到局域网地址）';

  // 输出 SDK snippet
  console.log(`
─────────────────────────────────────────────────
✅ MCP 配置完成！重启 AI 工具后即可使用 openlog MCP。

📱 移动端 SDK 接入（粘贴到你的 H5 页面）：

  可用局域网地址（手机与电脑不在同一 WiFi？选对应网卡）：
${networkIpLines}

  <!-- CDN + 连接远程监控（server 替换为上方手机可达的地址）-->
  <script src="https://unpkg.com/openlog@latest/dist/openlog.iife.js"></script>
  <script>
    OpenLog.init({
      projectId: 'my-app',
      server: 'ws://${primaryIp}:${port}',
      lang: 'zh'
    })
  </script>

  <!-- 纯本地（仅 Eruda，无需服务器） -->
  <script>
    OpenLog.init({ projectId: 'my-app', lang: 'zh' })
  </script>

  <!-- 选项 C：npm -->
  import OpenLog from 'openlog'
  new OpenLog({ projectId: 'my-app', server: 'ws://${primaryIp}:${port}', lang: 'zh' })

🖥️  启动 PC 监控面板：
  npx openlog             打开 http://localhost:${port}
  npx openlog -p 8080     自定义端口
─────────────────────────────────────────────────
`);
}

function printManualConfig(mcpEntry: object, port: number) {
  const allIps = getAllIpv4();
  const primaryIp = allIps[0]?.address ?? 'localhost';
  const networkIpLines = allIps.length > 0
    ? allIps.map(({ name, address }) => `    ${name.padEnd(12)} ws://${address}:${port}`).join('\n')
    : '    （未检测到局域网地址）';

  console.log(`手动配置 MCP（将以下内容加入你的 AI 工具 MCP 配置文件）：

  "mcpServers": {
    "openlog": ${JSON.stringify(mcpEntry, null, 6).replace(/\n/g, '\n  ')}
  }

支持的配置文件位置：
  Claude Code  →  .claude.json（项目根目录）
  Cursor       →  .cursor/mcp.json
  Windsurf     →  ~/.codeium/windsurf/mcp_config.json

指定工具：
  npx openlog init --for=claude
  npx openlog init --for=cursor
  npx openlog init --for=windsurf

可用局域网地址（手机与电脑不在同一 WiFi？选对应网卡）：
${networkIpLines}

SDK 接入（粘贴到 H5 页面，server 替换为手机可达的地址）：
  <script src="https://unpkg.com/openlog@latest/dist/openlog.iife.js"></script>
  <script>OpenLog.init({ projectId: 'my-app', server: 'ws://${primaryIp}:${port}', lang: 'zh' })</script>
`);
}
