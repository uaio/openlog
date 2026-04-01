# AIConsole SDK

AIConsole SDK 是一个用于移动端调试的 JavaScript SDK，可以实时将移动设备的 console 日志、网络请求和系统信息同步到远程调试控制台。

## 特性

- 实时日志同步 - 拦截并转发 console.log/warn/error/info
- 设备信息收集 - 自动获取设备型号、操作系统、浏览器信息
- WebSocket 通信 - 基于 WebSocket 的实时双向通信
- 心跳保活 - 自动维持连接状态
- 可配置开关 - 支持运行时启用/禁用远程监控

## 安装

```bash
npm install aiconsole
# 或
pnpm add aiconsole
```

## 快速开始

```typescript
import AIConsole from 'aiconsole';

// 初始化 AIConsole
const aiconsole = new AIConsole({
  projectId: 'your-project-id',
  server: 'ws://localhost:8080'
});

// 可选：禁用远程监控
aiconsole.disableRemote();

// 可选：重新启用远程监控
aiconsole.enableRemote();

// 检查远程监控状态
console.log(aiconsole.isRemoteEnabled());

// 销毁实例（恢复原始 console）
aiconsole.destroy();
```

## 配置选项

### AIConsoleOptions

```typescript
interface AIConsoleOptions {
  /** 项目 ID，必填 */
  projectId: string;

  /** 服务器地址，必填 */
  server: string;

  /** 默认启用的插件列表 */
  defaultPlugins?: string[];

  /** 心跳间隔（毫秒），默认 30000 */
  heartbeatInterval?: number;
}
```

## API 参考

### 构造函数

```typescript
new AIConsole(options: AIConsoleOptions)
```

创建一个新的 AIConsole 实例。

### 方法

#### enableRemote()

启用远程监控功能。

```typescript
aiconsole.enableRemote();
```

#### disableRemote()

禁用远程监控功能。此设置会保存到 localStorage，刷新页面后仍然生效。

```typescript
aiconsole.disableRemote();
```

#### isRemoteEnabled()

检查远程监控是否启用。

```typescript
const enabled = aiconsole.isRemoteEnabled();
console.log(enabled); // true 或 false
```

#### destroy()

销毁 AIConsole 实例，恢复原始 console 方法，并断开服务器连接。

```typescript
aiconsole.destroy();
```

## 工作原理

AIConsole 通过以下方式工作：

1. **设备识别** - 生成唯一的设备 ID 和 Tab ID
2. **Console 拦截** - 重写 console 方法以捕获日志
3. **WebSocket 连接** - 与服务器建立持久连接
4. **数据上报** - 将日志和设备信息实时发送到服务器
5. **心跳保活** - 定期发送心跳以维持连接

### 日志拦截

AIConsole 会拦截以下 console 方法：
- `console.log`
- `console.warn`
- `console.error`
- `console.info`

对于 `console.error`，会自动捕获堆栈跟踪信息。

### 堆栈跟踪清理

AIConsole 会自动清理堆栈跟踪，移除拦截器自身的帧，只保留用户代码的调用栈。

### 单例检测

AIConsole 会检测全局是否已存在实例，防止创建多个实例导致竞态条件。

## 注意事项

1. **性能影响** - AIConsole 会拦截所有 console 调用，在生产环境中建议谨慎使用
2. **隐私** - 会收集设备信息和 console 日志，确保用户知情
3. **内存管理** - 使用完毕后记得调用 `destroy()` 清理资源
4. **CORS** - 确保服务器支持 WebSocket 连接

## 示例项目

完整示例请参考项目主文档。

## 许可证

MIT
