import { wsClient } from '../ws-client.js';
import { API_BASE_URL } from '../config.js';
import { DeviceSelector } from '../lib/device-selector.js';

const deviceSelector = new DeviceSelector();

export const startPerfRun = {
  name: 'start_perf_run',
  description: '在手机端启动性能跑分。自动进入禅模式（屏蔽干扰采集），开始记录 FPS / Web Vitals / 长任务等数据。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: []
  },
  async execute(args: { deviceId?: string }): Promise<{ ok: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'start_perf_run' });
    return { ok: true };
  }
};

export const stopPerfRun = {
  name: 'stop_perf_run',
  description: '停止手机端性能跑分，退出禅模式，生成综合评分报告（A-F 等级 + 具体问题建议）。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: []
  },
  async execute(args: { deviceId?: string }): Promise<{ ok: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'stop_perf_run' });
    return { ok: true };
  }
};

export const getPerfReport = {
  name: 'get_perf_report',
  description: '获取手机端最新跑分报告，包含综合分、各指标评分、问题列表和优化建议。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' },
      sessionId: { type: 'string' as const, description: '跑分会话 ID（可选，不填则返回所有历史）' }
    },
    required: []
  },
  async execute(args: { deviceId?: string; sessionId?: string }): Promise<any> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    // perf_run 报告存在服务端 store，用 REST 读取历史数据
    const path = args.sessionId
      ? `/api/devices/${id}/perf-run/${args.sessionId}`
      : `/api/devices/${id}/perf-run`;
    const res = await fetch(`${API_BASE_URL}${path}`);
    if (!res.ok) throw new Error(`get_perf_report failed: ${res.statusText}`);
    return res.json();
  }
};

