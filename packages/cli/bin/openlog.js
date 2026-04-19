#!/usr/bin/env node
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const args = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: 'string', short: 'p' },
    for: { type: 'string' },
    host: { type: 'string' },
    'api-key': { type: 'string' },
    'cors-origin': { type: 'string' },
    persist: { type: 'boolean' },
    'db-path': { type: 'string' },
    'retention-days': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' }
  }
});

const subcommand = args.positionals[0];

if (args.values.help) {
  console.log(`
openLog — H5 移动端调试工具

用法:
  npx @openlog/cli              启动监控服务（PC 面板 + WebSocket）
  npx @openlog/cli init         自动配置 AI 工具 MCP（Claude/Cursor/Windsurf）
  npx @openlog/cli -p <port>    指定端口（默认 38291）
  npx @openlog/cli init --for=claude  指定 AI 工具

选项:
  -p, --port <port>          指定端口号
  --host <host>              指定公网地址（域名或 IP）
  --api-key <key>            设置 API Key 鉴权（也可用 OPENLOG_API_KEY 环境变量）
  --cors-origin <origins>    设置允许的 CORS 来源（逗号分隔，也可用 OPENLOG_CORS_ORIGIN）
  --persist                  启用 SQLite 持久化存储
  --db-path <path>           SQLite 数据库路径（默认 ~/.openlog/data.db）
  --retention-days <days>    数据保留天数（默认 7 天）
  --for <tool>               指定 AI 工具 (claude/cursor/windsurf)
  -h, --help                 显示帮助信息
  -v, --version              显示版本号
`);
  process.exit(0);
}

if (args.values.version) {
  const { readFileSync } = await import('fs');
  const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf-8'));
  console.log(pkg.version);
  process.exit(0);
}

function validatePort(portStr) {
  if (portStr === undefined) return undefined;
  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    console.error(`错误: 端口号必须是数字，收到 "${portStr}"`);
    process.exit(1);
  }
  if (port < 1 || port > 65535) {
    console.error(`错误: 端口号必须在 1-65535 范围内，收到 ${port}`);
    process.exit(1);
  }
  return port;
}

// Resolve web dist path: CLI package's public/ directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webDistPath = join(__dirname, '..', 'public');

if (subcommand === 'init') {
  const { init } = await import('@openlog/server/cli/init');
  await init({ forTool: args.values.for });
} else {
  const { start } = await import('@openlog/server/cli');
  const retentionDaysStr = args.values['retention-days'];
  await start({
    port: validatePort(args.values.port),
    host: args.values.host,
    webDistPath,
    apiKey: args.values['api-key'],
    corsOrigin: args.values['cors-origin'],
    persist: args.values.persist || false,
    dbPath: args.values['db-path'],
    retentionDays: retentionDaysStr ? parseInt(retentionDaysStr, 10) : undefined,
  });
}
