import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { networkInterfaces, homedir } from 'os';

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

const CLAUDE_COMMANDS: Record<string, string> = {
  'start.md': `# 启动 openLog 监控

调用 \`start_openlog\` MCP 工具启动 openLog Server 并建立 WebSocket 长连接。

启动成功后：
1. 打印服务地址和所有可用的 IPv4 地址（方便手机连接）
2. 提示用户在 H5 页面引入 SDK 并初始化
3. 调用 \`list_devices\` 工具检查是否有设备已连接

如果服务已经在运行，跳过启动直接检查设备连接状态。
`,

  'stop.md': `# 停止 openLog 监控

调用 \`stop_openlog\` MCP 工具断开 WebSocket 连接并关闭 openLog Server。

停止前先打印当前连接的设备数量，停止后确认服务已关闭。
`,

  'status.md': `# openLog 连接状态

调用 \`health_check\` MCP 工具，然后调用 \`list_devices\` 工具。

输出以下信息：
- Server 是否运行中（地址 + 端口）
- WebSocket 连接状态
- 当前在线设备列表（deviceId、平台、页面 URL、最后心跳时间）
- 如果没有设备连接，提示 SDK 初始化代码片段
`,

  'logs.md': `# 查看最新日志

调用 \`list_devices\` 获取当前在线设备。

如果只有一个设备，直接调用 \`get_console_logs\` 获取最近 50 条日志。
如果有多个设备，列出设备列表让用户选择（或取第一个设备）。

输出日志时：
- 错误（error/warn）用醒目标记 ⚠️ / ❌ 标出
- 按时间倒序排列，最新的在最前面
- 如果有 JS 报错，自动分析可能的原因
`,

  'screenshot.md': `# 截取当前页面截图

调用 \`list_devices\` 获取当前在线设备。

如果只有一个设备，直接调用 \`take_screenshot\` 对该设备截图。
如果有多个设备，取第一个在线设备截图。

截图完成后展示图片，并简要描述页面当前状态（标题、可见元素、是否有错误提示等）。
`,
};

function writeClaudeCommands(): void {
  const commandsDir = join(homedir(), '.claude', 'commands', 'openlog');
  mkdirSync(commandsDir, { recursive: true });
  for (const [filename, content] of Object.entries(CLAUDE_COMMANDS)) {
    writeFileSync(join(commandsDir, filename), content, 'utf-8');
  }
  console.log(`  ✅ 已写入 ~/.claude/commands/openlog/ (5 个命令)`);
  console.log(`     /openlog:start  /openlog:stop  /openlog:status  /openlog:logs  /openlog:screenshot`);
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
      writeClaudeCommands();
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
