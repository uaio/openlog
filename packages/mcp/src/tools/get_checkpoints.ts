import { API_BASE_URL } from '../config.js';
import { sharedDeviceSelector as deviceSelector } from '../lib/device-selector.js';


export const getCheckpoints = {
  name: 'get_checkpoints',
  description: `读取设备上由 AI 埋入的 @openlog[checkpoint] 日志，验证关键开发节点是否已执行。

使用场景：
- AI 在代码中埋入 console.log('@openlog[checkpoint] 节点: 描述') 后，让用户跑一遍流程
- 调用此工具读取所有 checkpoint 日志，判断哪些节点被执行了、哪些没有
- 用于验证功能逻辑是否按预期跑通

checkpoint 日志格式约定：
  console.log('@openlog[checkpoint] 节点名称: 描述信息')
  console.log('@openlog[checkpoint] 节点名称: 描述信息', { 附加数据 })

示例：
  console.log('@openlog[checkpoint] login: 用户点击登录按钮')
  console.log('@openlog[checkpoint] login: 接口请求发出', { url: '/api/login' })
  console.log('@openlog[checkpoint] login: token 写入成功', { hasToken: !!token })`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，不填则自动选择最近活跃设备）'
      },
      feature: {
        type: 'string' as const,
        description: '只查看特定功能的 checkpoint，例如 "login"（可选，不填则返回全部）'
      },
      limit: {
        type: 'number' as const,
        description: '最多返回条数，默认 100'
      }
    },
    required: []
  },

  async execute(args: { deviceId?: string; feature?: string; limit?: number }): Promise<unknown> {
    const deviceId = await deviceSelector.selectDevice(args.deviceId);
    const limit = args.limit ?? 200;

    const res = await fetch(`${API_BASE_URL}/api/devices/${deviceId}/logs?limit=${limit}`);
    if (!res.ok) throw new Error(`get_checkpoints failed: ${res.statusText}`);
    const logs: any[] = await res.json();

    // 过滤出 @openlog[checkpoint] 前缀的日志
    const checkpoints = logs.filter((log: any) => {
      const text = Array.isArray(log.args)
        ? log.args.map((a: any) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
        : String(log.message ?? '');
      return text.includes('@openlog[checkpoint]');
    });

    // 如果指定了 feature，进一步过滤
    const filtered = args.feature
      ? checkpoints.filter((log: any) => {
          const text = Array.isArray(log.args)
            ? log.args[0] ?? ''
            : log.message ?? '';
          return String(text).toLowerCase().includes(args.feature!.toLowerCase());
        })
      : checkpoints;

    // 整理为可读格式
    const result = filtered.map((log: any) => {
      const args_arr: any[] = Array.isArray(log.args) ? log.args : [log.message];
      const text = typeof args_arr[0] === 'string' ? args_arr[0] : JSON.stringify(args_arr[0]);
      // 解析 @openlog[checkpoint] 节点名称: 描述
      const match = text.match(/@openlog\[checkpoint\]\s*([^:]+):\s*(.*)/i);
      return {
        node: match ? match[1].trim() : 'unknown',
        description: match ? match[2].trim() : text,
        data: args_arr.length > 1 ? args_arr.slice(1) : undefined,
        timestamp: log.timestamp,
        level: log.level
      };
    });

    return {
      deviceId,
      total: result.length,
      feature: args.feature ?? 'all',
      checkpoints: result,
      summary: result.length === 0
        ? '⚠️ 未发现任何 @openlog[checkpoint] 日志，请确认代码中已埋点且用户已执行相关操作'
        : `✅ 共发现 ${result.length} 个检测点：${[...new Set(result.map(r => r.node))].join(' → ')}`
    };
  }
};
