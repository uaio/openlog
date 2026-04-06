import { DeviceSelector } from '../lib/device-selector.js';
import { startMonitor } from './monitor.js';

const deviceSelector = new DeviceSelector();

export const initDevSession = {
  name: 'init_dev_session',
  description: `【开发会话启动工具】在开始开发 H5 页面功能之前，自动调用此工具完成所有监控准备。
无需任何配置，调用一次即可：
  - 自动启动报错监听器（error sub-agent）
  - 自动启动日志监听器（log sub-agent）
  - 返回完整的子代理编排 protocol

返回的 protocol 包含两个子代理的 monitorId 和详细的运行指令。
主代理按照 protocol 启动子代理后即可专注开发，无需再关心日志监控。`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，默认自动选择最近活跃设备）'
      }
    },
    required: []
  },

  async execute(args: { deviceId?: string }): Promise<{
    ok: boolean;
    deviceId: string;
    errorMonitorId: string;
    logMonitorId: string;
    protocol: {
      summary: string;
      errorSubAgent: SubAgentProtocol;
      logSubAgent: SubAgentProtocol;
      mainAgent: MainAgentProtocol;
    };
  }> {
    const deviceId = await deviceSelector.selectDevice(args.deviceId);

    const [errorResult, logResult] = await Promise.all([
      startMonitor.execute({ type: 'error', deviceId }),
      startMonitor.execute({ type: 'log', deviceId })
    ]);

    return {
      ok: true,
      deviceId,
      errorMonitorId: errorResult.monitorId,
      logMonitorId: logResult.monitorId,
      protocol: {
        summary: '✅ 开发会话已就绪。请按照 protocol 启动两个子代理，主代理专注开发即可。',
        errorSubAgent: {
          role: '报错监听子代理',
          monitorId: errorResult.monitorId,
          instruction: `你是一个报错监听子代理，持续监听设备 ${deviceId} 的 JS 报错。
运行规则：
1. 循环调用 poll_monitor("${errorResult.monitorId}")
2. 若 hasAlert=true：立即向主代理报告 alertSummary，暂停轮询等待主代理处理完成
3. 若 hasAlert=false：静默等待 3000ms 后继续轮询
4. 收到主代理「继续」指令后恢复轮询
5. 收到主代理「停止」指令后调用 stop_monitor("${errorResult.monitorId}") 退出`,
          pollIntervalMs: 3000,
          alertCondition: 'hasAlert === true（任意新 error 日志）'
        },
        logSubAgent: {
          role: '日志流子代理',
          monitorId: logResult.monitorId,
          instruction: `你是一个日志流子代理，持续监听设备 ${deviceId} 的所有日志。
运行规则：
1. 循环调用 poll_monitor("${logResult.monitorId}")
2. 若 hasAlert=true（warn/error 或日志突增）：向主代理报告 alertSummary
3. 若 newEvents.length > 0：将日志摘要静默记录，供主代理查询
4. 每次 poll 间隔 5000ms
5. 收到主代理「停止」指令后调用 stop_monitor("${logResult.monitorId}") 退出`,
          pollIntervalMs: 5000,
          alertCondition: 'hasAlert === true（warn/error 级别 或 单次 >20 条日志）'
        },
        mainAgent: {
          role: '主开发代理',
          instruction: `开发流程规则：
1. 每写完一个功能节点 → 调用 verify_checkpoint 在真机验证
2. 收到报错子代理告警 → 立即暂停开发，调用 get_console_logs(level="error") 定位问题，修复后重新 verify_checkpoint
3. 收到日志子代理告警 → 根据严重程度决定是否暂停处理
4. verify_checkpoint 失败 → 修复代码，重新验证，不得跳过继续下一节点
5. verify_checkpoint 通过 → 标注「✅ 节点已验证」，继续下一节点
6. 整个功能完成后 → 调用 health_check 确认健康分 ≥ 80
7. 会话结束 → 通知两个子代理停止`
        }
      }
    };
  }
};

interface SubAgentProtocol {
  role: string;
  monitorId: string;
  instruction: string;
  pollIntervalMs: number;
  alertCondition: string;
}

interface MainAgentProtocol {
  role: string;
  instruction: string;
}
