# 日志搜索/筛选功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Web 控制台的 LogPanel 中添加级别过滤和关键词搜索功能

**Architecture:** 纯前端过滤，在 LogPanel 组件内添加 filterLevel 和 searchText 两个 state，对 logs 数组做 Array.filter，不涉及后端改动

**Tech Stack:** React 18, TypeScript, 内联样式（沿用现有方案）

---

## 文件变更

| 文件 | 操作 | 职责 |
|------|------|------|
| `packages/web/src/components/LogPanel.tsx` | 修改 | 新增工具栏 UI + 过滤逻辑 + 样式 |

---

### Task 1: 添加过滤状态和过滤逻辑

**Files:**
- Modify: `packages/web/src/components/LogPanel.tsx:1-131`

- [ ] **Step 1: 添加 filterLevel 和 searchText state**

在 `LogPanel` 组件内，`clearingHistory` state 之后添加：

```typescript
const [filterLevel, setFilterLevel] = useState<ConsoleLog['level'] | 'all'>('all');
const [searchText, setSearchText] = useState('');
```

同时在文件顶部 import 中添加 `ConsoleLog` 类型：

```typescript
import type { ConsoleLog } from '../types/index.js';
```

- [ ] **Step 2: 添加过滤后的日志计算**

在 `handleClearHistory` 函数之后、return 之前添加：

```typescript
const filteredLogs = logs.filter(log => {
  const levelMatch = filterLevel === 'all' || log.level === filterLevel;
  const textMatch = !searchText || log.message.toLowerCase().includes(searchText.toLowerCase());
  return levelMatch && textMatch;
});
```

- [ ] **Step 3: 设备切换时重置筛选状态**

修改现有的 `useEffect`（第 17-19 行的调试日志 useEffect），在其后新增一个 useEffect：

```typescript
// 切换设备时重置筛选
useEffect(() => {
  setFilterLevel('all');
  setSearchText('');
}, [deviceId]);
```

- [ ] **Step 4: 将日志渲染改为使用 filteredLogs**

将第 114 行 `logs.length === 0` 改为 `filteredLogs.length === 0`（用于空状态判断）。

将第 125 行 `logs.map(...)` 改为 `filteredLogs.map(...)`。

将第 63 行 `logs.length` 的提示文字中的 `logs.length` 保留不变（显示总数而非过滤后的数量，让用户知道实际有多少日志）。

- [ ] **Step 5: 验证编译通过**

Run: `cd /Users/anan/github/aiconsole && pnpm --filter @aiconsole/web build`
Expected: 编译成功，无 TypeScript 错误

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/components/LogPanel.tsx
git commit -m "feat(web): 添加日志过滤状态和过滤逻辑"
```

---

### Task 2: 添加工具栏 UI

**Files:**
- Modify: `packages/web/src/components/LogPanel.tsx`

- [ ] **Step 1: 在 header 和 logContainer 之间插入工具栏**

在第 103 行 `</div>`（header 结束标签）之后、第 105 行 `<div ref={containerRef}` 之前插入工具栏 JSX：

```tsx
{/* 筛选工具栏 */}
<div style={styles.toolbar}>
  <div style={styles.levelButtons}>
    {(['all', 'log', 'warn', 'error', 'info'] as const).map(level => (
      <button
        key={level}
        onClick={() => setFilterLevel(level)}
        style={{
          ...styles.levelButton,
          ...(filterLevel === level ? styles.levelButtonActive : {})
        }}
      >
        {level === 'all' ? '全部' : level.toUpperCase()}
      </button>
    ))}
  </div>
  <input
    type="text"
    placeholder="搜索日志..."
    value={searchText}
    onChange={e => setSearchText(e.target.value)}
    style={styles.searchInput}
  />
</div>
```

- [ ] **Step 2: 添加工具栏样式**

在 `styles` 对象中（第 134 行 `const styles = {` 之后），在 `header` 样式后面添加：

```typescript
toolbar: {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 16px',
  borderBottom: '1px solid #e0e0e0',
  backgroundColor: '#fafafa'
},
levelButtons: {
  display: 'flex',
  gap: '4px'
},
levelButton: {
  padding: '4px 10px',
  fontSize: '12px',
  border: '1px solid #d9d9d9',
  borderRadius: '3px',
  backgroundColor: '#fff',
  color: '#666',
  cursor: 'pointer',
  transition: 'all 0.2s'
},
levelButtonActive: {
  backgroundColor: '#1890ff',
  color: '#fff',
  borderColor: '#1890ff'
},
searchInput: {
  flex: 1,
  padding: '4px 10px',
  fontSize: '12px',
  border: '1px solid #d9d9d9',
  borderRadius: '3px',
  outline: 'none',
  backgroundColor: '#fff'
},
```

- [ ] **Step 3: 更新空状态判断**

将当前渲染日志的判断逻辑改为同时考虑无日志和筛选无结果两种情况。修改 `logContainer` 内的内容：

找到这段（约第 109-128 行）：
```tsx
{loading ? (
  <div style={styles.empty}>...</div>
) : logs.length === 0 ? (
  <div style={styles.empty}>...</div>
) : (
  logs.map(...)
)}
```

替换为：
```tsx
{loading ? (
  <div style={styles.empty}>
    <div style={styles.loadingIcon}>⏳</div>
    <div>正在加载历史日志...</div>
  </div>
) : filteredLogs.length === 0 ? (
  <div style={styles.empty}>
    <div style={styles.emptyIcon}>{logs.length === 0 ? '📝' : '🔍'}</div>
    <div style={styles.emptyText}>
      {logs.length === 0 ? '暂无日志' : '没有匹配的日志'}
    </div>
    <div style={styles.emptyHint}>
      {logs.length === 0
        ? '在移动设备上执行操作后，日志将自动显示在这里'
        : `共 ${logs.length} 条日志，尝试调整筛选条件`}
    </div>
  </div>
) : (
  filteredLogs.map((log, index) => (
    <LogEntry key={`${log.timestamp}-${index}`} log={log} />
  ))
)}
```

- [ ] **Step 4: 验证编译和页面功能**

Run: `cd /Users/anan/github/aiconsole && pnpm --filter @aiconsole/web build`
Expected: 编译成功

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/LogPanel.tsx
git commit -m "feat(web): 添加日志级别过滤和关键词搜索工具栏"
```

---

## 验证清单

实现完成后，手动验证以下场景：

1. [ ] 点击 All/Log/Warn/Error/Info 按钮，日志列表只显示对应级别
2. [ ] 输入关键词，日志列表实时过滤
3. [ ] 同时选中级别 + 输入关键词，两者 AND 组合生效
4. [ ] 切换设备后，筛选状态重置为 All + 空搜索
5. [ ] 无匹配结果时显示 "没有匹配的日志" 提示
6. [ ] 清空日志后筛选状态保留
