# 悬浮球功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 为 vconsole 添加可拖拽、可吸附的悬浮球控制按钮，支持边缘吸附和连击激活

**架构:** 采用模块化设计，将功能分解为三个独立的类：ClickDetector 负责连击检测，DragHandler 负责拖拽处理，FloatingBall 作为主组件协调状态和交互

**技术栈:** TypeScript, DOM API, Touch Events, Mouse Events, CSS

---

## 文件结构

### 新增文件
- `packages/sdk/src/ui/ClickDetector.ts` - 连击检测器类
- `packages/sdk/src/ui/DragHandler.ts` - 拖拽处理器类
- `packages/sdk/src/ui/FloatingBall.ts` - 悬浮球主组件
- `packages/sdk/src/ui/index.ts` - UI 组件导出入口
- `packages/sdk/src/ui/floating-ball.css` - 悬浮球样式

### 修改文件
- `packages/sdk/src/index.ts` - 添加 FloatingBall 导出

---

## 任务分解

### Task 1: 创建 ClickDetector 类

**文件:**
- Create: `packages/sdk/src/ui/ClickDetector.ts`

- [ ] **Step 1: 创建 ClickDetector 类文件**

```typescript
// packages/sdk/src/ui/ClickDetector.ts

/**
 * 连击检测器
 * 检测在指定时间窗口内的多次点击
 */
export class ClickDetector {
  private clicks: number[] = [];
  private readonly windowMs: number;
  private readonly callback: () => void;

  /**
   * @param windowMs 时间窗口（毫秒）
   * @param callback 达到连击条件时的回调
   * @param requiredClicks 需要的点击次数，默认 3
   */
  constructor(
    windowMs: number,
    callback: () => void,
    private readonly requiredClicks: number = 3
  ) {
    this.windowMs = windowMs;
    this.callback = callback;
  }

  /**
   * 注册一次点击
   * 如果在时间窗口内达到所需点击次数，触发回调
   */
  registerClick(): void {
    const now = Date.now();
    this.clicks.push(now);

    // 清理超出时间窗口的点击记录
    this.clicks = this.clicks.filter(click => now - click < this.windowMs);

    // 检查是否达到连击条件
    if (this.clicks.length >= this.requiredClicks) {
      this.callback();
      this.reset();
    }
  }

  /**
   * 重置点击计数
   */
  reset(): void {
    this.clicks = [];
  }
}
```

- [ ] **Step 2: 提交 ClickDetector 类**

```bash
git add packages/sdk/src/ui/ClickDetector.ts
git commit -m "feat(vconsole): 添加 ClickDetector 连击检测器类"
```

---

### Task 2: 创建 DragHandler 类

**文件:**
- Create: `packages/sdk/src/ui/DragHandler.ts`

- [ ] **Step 1: 创建 DragHandler 类文件**

```typescript
// packages/sdk/src/ui/DragHandler.ts

export type Edge = 'left' | 'right' | 'top' | 'bottom';

export interface DragHandlerOptions {
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (edge: Edge | null) => void;
  snapThreshold?: number; // 吸附阈值（px），默认 20
}

/**
 * 拖拽处理器
 * 处理鼠标和触摸事件的拖拽逻辑
 */
export class DragHandler {
  private state: 'idle' | 'dragging' = 'idle';
  private startPos = { x: 0, y: 0 };
  private currentPos = { x: 0, y: 0 };
  private readonly snapThreshold: number;

  constructor(
    private readonly element: HTMLElement,
    private readonly options: DragHandlerOptions = {}
  ) {
    this.snapThreshold = options.snapThreshold ?? 20;
    this.bindEvents();
  }

  private bindEvents(): void {
    // 触摸事件
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd);

    // 鼠标事件
    this.element.addEventListener('mousedown', this.handleMouseDown);
  }

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    this.start(touch.clientX, touch.clientY);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    this.move(touch.clientX, touch.clientY);
  };

  private handleTouchEnd = (): void => {
    this.end();
  };

  private handleMouseDown = (e: MouseEvent): void => {
    this.start(e.clientX, e.clientY);

    const handleMouseMove = (ev: MouseEvent) => this.move(ev.clientX, ev.clientY);
    const handleMouseUp = () => {
      this.end();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  /**
   * 开始拖拽
   */
  start(x: number, y: number): void {
    this.state = 'dragging';
    this.startPos = { x, y };
    this.currentPos = { x, y };
    this.options.onDragStart?.();
  }

  /**
   * 拖拽中
   */
  move(x: number, y: number): void {
    if (this.state !== 'dragging') return;

    this.currentPos = { x, y };
    this.options.onDragMove?.(x, y);
  }

  /**
   * 结束拖拽
   */
  end(): void {
    if (this.state !== 'dragging') return;

    this.state = 'idle';
    const edge = this.getNearestEdge(this.currentPos.x, this.currentPos.y);
    this.options.onDragEnd?.(edge);
  }

  /**
   * 获取最近的边缘
   * @returns 如果距离边缘 < snapThreshold 返回边缘，否则返回 null
   */
  getNearestEdge(x: number, y: number): Edge | null {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (x < this.snapThreshold) return 'left';
    if (x > width - this.snapThreshold) return 'right';
    if (y < this.snapThreshold) return 'top';
    if (y > height - this.snapThreshold) return 'bottom';

    return null;
  }

  /**
   * 销毁，移除事件监听
   */
  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
  }
}
```

- [ ] **Step 2: 提交 DragHandler 类**

```bash
git add packages/sdk/src/ui/DragHandler.ts
git commit -m "feat(vconsole): 添加 DragHandler 拖拽处理器类"
```

---

### Task 3: 安装 CSS 注入插件并验证

**文件:**
- Modify: `packages/sdk/build/vite.config.ts`
- Modify: `packages/sdk/package.json`
- Create: `packages/sdk/src/ui/floating-ball.css`

**背景说明:** vite 的库模式默认不会将 CSS 打包进 JS。使用 `vite-plugin-css-injected-by-js` 插件将 CSS 注入到 JS 中，这样用户导入组件时样式会自动生效。该插件与 `vite-plugin-dts` 兼容，不会影响类型定义生成。

- [ ] **Step 1: 安装 CSS 注入插件**

```bash
cd packages/sdk && pnpm add -D vite-plugin-css-injected-by-js
```

预期输出：插件安装成功，package.json 的 devDependencies 中包含该插件

- [ ] **Step 2: 提交插件安装**

```bash
git add packages/sdk/package.json pnpm-lock.yaml
git commit -m "chore(vconsole): 安装 vite-plugin-css-injected-by-js 插件"
```

- [ ] **Step 3: 更新 vite.config.ts 添加插件**

**修改前（第 1-18 行）：**
```typescript
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'AIConsole',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      input: {
        index: './src/index.ts'
      }
    }
  },
  plugins: [dts()],
  test: {
    include: ['**/test/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**']
  }
});
```

**修改后（第 1-19 行）：**
```typescript
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'AIConsole',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      input: {
        index: './src/index.ts'
      }
    }
  },
  plugins: [
    dts(),
    cssInjectedByJsPlugin({ topExecutionPriority: false })
  ],
  test: {
    include: ['**/test/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**']
  }
});
```

**注意:** `topExecutionPriority: false` 确保 CSS 在其他代码之后注入，避免样式闪烁。

- [ ] **Step 4: 创建 CSS 样式文件**

```css
/* packages/sdk/src/ui/floating-ball.css */

.floating-ball {
  position: fixed;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  user-select: none;
  z-index: 99999;
  opacity: 0.6;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-ball:hover {
  opacity: 0.8;
}

.floating-ball .icon {
  width: 24px;
  height: 24px;
  fill: white;
}

/* 拖动状态 */
.floating-ball.dragging {
  opacity: 1 !important;
  cursor: grabbing;
  transition: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

/* 吸附到左侧 - 球体在左边，裁掉左半边显示右半边 */
.floating-ball.snapped-left {
  left: 0 !important;
  top: 50% !important;
  transform: translateY(-50%);
  clip-path: inset(0 0 0 50%);
  opacity: 0.3;
}

/* 吸附到右侧 - 球体在右边，裁掉右半边显示左半边 */
.floating-ball.snapped-right {
  right: 0 !important;
  top: 50% !important;
  transform: translateY(-50%);
  clip-path: inset(0 50% 0 0);
  opacity: 0.3;
}

/* 吸附到顶部 - 球体在顶部，裁掉上半边显示下半边 */
.floating-ball.snapped-top {
  top: 0 !important;
  left: 50% !important;
  transform: translateX(-50%);
  clip-path: inset(0 0 50% 0);
  opacity: 0.3;
}

/* 吸附到底部 - 球体在底部，裁掉下半边显示上半边 */
.floating-ball.snapped-bottom {
  bottom: 0 !important;
  left: 50% !important;
  transform: translateX(-50%);
  clip-path: inset(50% 0 0 0);
  opacity: 0.3;
}

/* 激活动画 */
@keyframes activate-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.floating-ball.activate {
  animation: activate-pulse 0.3s ease;
}
```

**注意:** CSS 文件与 FloatingBall.ts 在同一目录（`packages/sdk/src/ui/`），所以在代码中使用 `import './floating-ball.css';` 即可正确导入。

- [ ] **Step 5: 验证配置正确性**

```bash
cd packages/sdk && pnpm build
```

预期输出：构建成功，没有 CSS 相关错误

- [ ] **Step 6: 清理测试构建产物**

```bash
cd packages/sdk && rm -rf dist/
```

- [ ] **Step 7: 提交构建配置和样式**

```bash
git add packages/sdk/build/vite.config.ts packages/sdk/src/ui/floating-ball.css
git commit -m "feat(vconsole): 添加构建配置支持 CSS 注入和悬浮球样式"
```

---

### Task 4: 创建 FloatingBall 主组件

**文件:**
- Create: `packages/sdk/src/ui/FloatingBall.ts`
- Modify: `packages/sdk/src/ui/FloatingBall.ts` (后续步骤)

- [ ] **Step 1: 创建 FloatingBall 类框架**

```typescript
// packages/sdk/src/ui/FloatingBall.ts

import { ClickDetector } from './ClickDetector.js';
import { DragHandler, type Edge } from './DragHandler.js';
import './floating-ball.css';

export type BallState = 'normal' | 'snapped' | 'dragging';

export interface FloatingBallOptions {
  /** 悬浮球图标（SVG 字符串或 URL） */
  icon?: string;
  /** 悬浮球大小（px），默认 44 */
  size?: number;
  /** 吸附阈值（px），默认 20 */
  snapThreshold?: number;
  /** 连击时间窗口（ms），默认 500 */
  clickWindow?: number;
  /** 激活面板的回调 */
  onActivate?: () => void;
  /** 默认位置（从右下角偏移） */
  defaultPosition?: { x: number; y: number };
}

/**
 * 悬浮球组件
 * 支持拖拽、边缘吸附和连击激活
 */
export class FloatingBall {
  private element: HTMLElement;
  private state: BallState = 'normal';
  private snappedSide: Edge | null = null;
  private clickDetector: ClickDetector;
  private dragHandler: DragHandler;
  private position = { x: 0, y: 0 };

  constructor(private readonly options: FloatingBallOptions = {}) {
    // 创建 DOM 元素
    this.element = this.createBallElement();

    // 初始化连击检测器
    this.clickDetector = new ClickDetector(
      options.clickWindow ?? 500,
      () => this.activate()
    );

    // 初始化拖拽处理器
    this.dragHandler = new DragHandler(this.element, {
      snapThreshold: options.snapThreshold ?? 20,
      onDragStart: () => this.handleDragStart(),
      onDragMove: (x, y) => this.handleDragMove(x, y),
      onDragEnd: (edge) => this.handleDragEnd(edge)
    });

    // 绑定点击事件
    this.element.addEventListener('click', () => this.handleClick());

    // 设置默认位置（右下角）
    const defaultPos = options.defaultPosition ?? { x: 20, y: 100 };
    this.setPosition(
      window.innerWidth - defaultPos.x - (options.size ?? 44),
      window.innerHeight - defaultPos.y - (options.size ?? 44)
    );
  }

  /**
   * 创建悬浮球 DOM 元素
   */
  private createBallElement(): HTMLElement {
    const ball = document.createElement('div');
    ball.className = 'floating-ball';

    // 添加图标
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.innerHTML = this.options.icon ?? this.getDefaultIcon();
    ball.appendChild(icon);

    return ball;
  }

  /**
   * 获取默认图标
   */
  private getDefaultIcon(): string {
    // 返回一个简单的 SVG 控制台图标
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-2-8h-6v2h6v-2zm0 4h-6v2h6v-2zm-8-6H4v6h6v-6z"/>
    </svg>`;
  }

  /**
   * 处理拖拽开始
   */
  private handleDragStart(): void {
    this.state = 'dragging';
    this.element.classList.add('dragging');
    this.element.classList.remove(`snapped-${this.snappedSide}`);
    this.snappedSide = null;
  }

  /**
   * 处理拖拽移动
   */
  private handleDragMove(x: number, y: number): void {
    // 更新位置，使球心跟随鼠标/手指
    const size = this.options.size ?? 44;
    this.setPosition(x - size / 2, y - size / 2);
  }

  /**
   * 处理拖拽结束
   */
  private handleDragEnd(edge: Edge | null): void {
    this.element.classList.remove('dragging');

    if (edge) {
      // 吸附到边缘
      this.snapTo(edge);
    } else {
      this.state = 'normal';
    }
  }

  /**
   * 处理点击
   */
  private handleClick(): void {
    if (this.state === 'dragging') {
      // 拖动过程中不处理点击
      return;
    }

    if (this.state === 'snapped') {
      // 吸附状态下，检测连击
      this.clickDetector.registerClick();
    } else {
      // 正常状态下，直接激活
      this.options.onActivate?.();
    }
  }

  /**
   * 设置位置
   */
  private setPosition(x: number, y: number): void {
    this.position = { x, y };
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  /**
   * 挂载到页面
   */
  mount(): void {
    document.body.appendChild(this.element);
  }

  /**
   * 显示悬浮球
   */
  show(): void {
    this.element.style.display = 'flex';
  }

  /**
   * 隐藏悬浮球
   */
  hide(): void {
    this.element.style.display = 'none';
  }

  /**
   * 吸附到指定边缘
   */
  snapTo(side: Edge): void {
    this.state = 'snapped';
    this.snappedSide = side;

    // 移除旧的吸附类
    this.element.classList.remove('snapped-left', 'snapped-right', 'snapped-top', 'snapped-bottom');

    // 添加新的吸附类
    this.element.classList.add(`snapped-${side}`);
  }

  /**
   * 激活（从吸附态恢复）
   */
  activate(): void {
    // 添加激活动画
    this.element.classList.add('activate');
    setTimeout(() => {
      this.element.classList.remove('activate');
    }, 300);

    // 重置连击检测
    this.clickDetector.reset();

    // 移除吸附状态
    if (this.snappedSide) {
      this.element.classList.remove(`snapped-${this.snappedSide}`);
      this.snappedSide = null;
    }

    this.state = 'normal';
    this.element.style.opacity = '0.6';

    // 触发回调
    this.options.onActivate?.();
  }

  /**
   * 销毁悬浮球
   */
  destroy(): void {
    this.dragHandler.destroy();
    this.element.remove();
  }
}
```

- [ ] **Step 2: 提交 FloatingBall 主组件**

```bash
git add packages/sdk/src/ui/FloatingBall.ts
git commit -m "feat(vconsole): 添加 FloatingBall 悬浮球主组件"
```

---

### Task 5: 创建 UI 模块导出

**文件:**
- Create: `packages/sdk/src/ui/index.ts`

- [ ] **Step 1: 创建导出文件**

```typescript
// packages/sdk/src/ui/index.ts

export { ClickDetector } from './ClickDetector.js';
export { DragHandler } from './DragHandler.js';
export { FloatingBall } from './FloatingBall.js';
export type { Edge } from './DragHandler.js';
export type { BallState, FloatingBallOptions } from './FloatingBall.js';
```

- [ ] **Step 2: 提交导出文件**

```bash
git add packages/sdk/src/ui/index.ts
git commit -m "feat(vconsole): 添加 UI 模块导出入口"
```

---

### Task 6: 在主入口导出 FloatingBall

**文件:**
- Modify: `packages/sdk/src/index.ts`

**背景说明:** 现有的 index.ts 文件前 3 行是导入语句，第 5 行是 `export const version = '0.1.0';`。需要在第 3 行后添加 FloatingBall 导入，在第 4 行（空行）后添加命名导出。

- [ ] **Step 1: 在第 3 行后添加 FloatingBall 导入**

**修改前（第 1-3 行）：**
```typescript
import { getDeviceInfo, generateTabId, updateDeviceActiveTime } from './core/device.js';
import { Reporter } from './transport/reporter.js';
import type { RemoteConfig } from './types/index.js';
```

**修改后（第 1-4 行）：**
```typescript
import { getDeviceInfo, generateTabId, updateDeviceActiveTime } from './core/device.js';
import { Reporter } from './transport/reporter.js';
import type { RemoteConfig } from './types/index.js';
import { FloatingBall } from './ui/index.js';
```

- [ ] **Step 2: 在第 5 行之前添加 FloatingBall 的命名导出**

**修改前（第 4-5 行）：**
```typescript
// 第 4 行是空行
export const version = '0.1.0';
```

**修改后（第 4-8 行）：**
```typescript
// 导出 FloatingBall 供外部使用
export { FloatingBall };
export type { FloatingBallOptions, BallState } from './ui/index.js';

export const version = '0.1.0';
```

- [ ] **Step 3: 提交导出更新**

```bash
git add packages/sdk/src/index.ts
git commit -m "feat(vconsole): 导出 FloatingBall 组件"
```

---

### Task 7: 创建测试 HTML 文件

**文件:**
- Create: `test-floating-ball.html`（在项目根目录）

**背景说明:** 测试文件使用 ES 模块导入，导入路径相对于项目根目录。需要先构建 vconsole 包才能使用。

- [ ] **Step 1: 创建测试文件**

在项目根目录创建 `test-floating-ball.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>悬浮球测试</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    h1 { color: #333; }
    .instruction {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .instruction h3 { margin-top: 0; }
    .vconsole-panel {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 99998;
      display: none;
      padding: 20px;
      overflow-y: auto;
    }
    .vconsole-panel.show {
      display: block;
    }
    .close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 10px 20px;
      background: #ff4d4f;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>悬浮球功能测试</h1>

    <div class="instruction">
      <h3>✅ 功能清单</h3>
      <ul>
        <li>点击悬浮球：显示/隐藏面板</li>
        <li>拖动悬浮球：随意移动</li>
        <li>靠近边缘：自动吸附（显示半个球，半透明）</li>
        <li>吸附后连击 3 次：恢复完整显示（500ms 内）</li>
        <li>拖动中：不透明 + 阴影放大</li>
      </ul>
    </div>

    <div class="instruction">
      <h3>🧪 测试步骤</h3>
      <ol>
        <li>点击悬浮球，验证面板显示/隐藏</li>
        <li>拖动悬浮球到屏幕中央，松开</li>
        <li>拖动悬浮球到屏幕边缘，验证自动吸附</li>
        <li>在吸附状态下，单击验证无效</li>
        <li>在吸附状态下，快速连击 3 次，验证恢复</li>
        <li>测试四条边的吸附效果</li>
      </ol>
    </div>
  </div>

  <div class="vconsole-panel" id="panel">
    <button class="close-btn" onclick="togglePanel()">关闭</button>
    <h2>VConsole 面板</h2>
    <p>这是模拟的 vconsole 调试面板。</p>
    <div id="logs"></div>
  </div>

  <script type="module">
    // 导入路径相对于项目根目录
    import { FloatingBall } from './packages/sdk/dist/index.js';

    const panel = document.getElementById('panel');
    const logs = document.getElementById('logs');
    let isPanelShown = false;

    function togglePanel() {
      isPanelShown = !isPanelShown;
      panel.classList.toggle('show', isPanelShown);

      if (isPanelShown) {
        addLog('面板已打开');
      } else {
        addLog('面板已关闭');
      }
    }

    function addLog(message) {
      const time = new Date().toLocaleTimeString();
      logs.innerHTML = `<div>[${time}] ${message}</div>` + logs.innerHTML;
    }

    // 创建悬浮球
    const ball = new FloatingBall({
      onActivate: () => {
        addLog('悬浮球被激活');
        togglePanel();
      }
    });

    ball.mount();
    addLog('悬浮球已创建');
  </script>
</body>
</html>
```

**注意:** 此文件依赖 vconsole 包的构建产物。在 Task 8 构建完成后才能正常使用。

- [ ] **Step 2: 提交测试文件**

```bash
git add test-floating-ball.html
git commit -m "test: 添加悬浮球测试页面"
```

---

### Task 8: 构建和测试

**文件:**
- (不涉及新文件，执行构建命令)

**背景说明:** 需要清理旧的构建产物，重新构建，然后通过本地服务器测试（避免 CORS 问题）。

- [ ] **Step 1: 清理旧构建产物**

```bash
cd packages/sdk && rm -rf dist/
```

预期输出：dist 目录被清空

- [ ] **Step 2: 构建 vconsole 包**

```bash
cd packages/sdk && pnpm build
```

预期输出：构建成功，dist 目录包含以下文件：
- `dist/index.js` (ES 模块)
- `dist/index.cjs` (CommonJS 模块)
- `dist/index.d.ts` (类型定义)
- CSS 应已注入到 JS 文件中

- [ ] **Step 3: 验证构建产物**

```bash
ls -la packages/sdk/dist/
```

预期输出：显示所有构建文件

```bash
grep -c "floating-ball" packages/sdk/dist/index.js
```

预期输出：数字 > 0，表示悬浮球代码已包含在构建产物中

- [ ] **Step 4: 启动本地服务器测试**

**注意:** 直接打开 HTML 文件可能遇到 CORS 问题，建议使用本地服务器。

```bash
# 在项目根目录安装 serve（如果还没安装）
pnpm add -D serve

# 启动服务器
npx serve . -p 8080
```

预期输出：服务器启动在 http://localhost:8080

- [ ] **Step 5: 在浏览器中测试**

访问 http://localhost:8080/test-floating-ball.html，验证：
- 悬浮球显示在右下角
- 点击可以切换面板显示/隐藏
- 拖动流畅
- 靠近边缘自动吸附
- 吸附后显示半个球，半透明
- 吸附后连击 3 次恢复
- 所有动画流畅

- [ ] **Step 6: 测试移动端兼容性**

使用浏览器开发者工具的移动模拟（F12 → 切换设备工具栏）：
1. 切换到移动设备视图（如 iPhone 14 Pro）
2. 测试触摸拖动
3. 测试边缘吸附
4. 测试连击激活

- [ ] **Step 7: 提交构建产物**

```bash
git add packages/sdk/dist/ package.json pnpm-lock.yaml
git commit -m "chore: 更新 vconsole 构建产物和 serve 依赖"
```

---

## 验收标准

完成所有任务后，以下标准应全部满足：

- [ ] 悬浮球默认显示在右下角，不遮挡页面内容
- [ ] 点击正常态悬浮球可以切换 vconsole 面板显示/隐藏
- [ ] 拖动流畅，无延迟感，跟手性好
- [ ] 靠近屏幕边缘（<20px）自动吸附
- [ ] 吸附后只显示半个球，半透明（opacity: 0.3）
- [ ] 吸附后单击无效
- [ ] 连续点击 3 次（500ms 内）恢复完整显示
- [ ] 拖动过程中透明度变为 1，阴影放大
- [ ] 所有动画流畅自然（300ms 过渡）
- [ ] 移动端和 PC 端都能正常工作
- [ ] 代码通过 TypeScript 类型检查
- [ ] 构建产物正确生成

---

## 技术要点

### DOM 操作
- 使用 `position: fixed` 确保悬浮球相对于视口定位
- 使用 `z-index: 99999` 确保在最上层
- 使用 `clip-path` 实现半个球显示效果

### 事件处理
- 同时支持 Touch Events 和 Mouse Events
- 拖动时使用 `passive: false` 防止默认滚动
- 通过状态区分拖动和点击

### CSS 动画
- 使用 `transition` 实现平滑过渡
- 拖动时移除 `transition` 避免延迟
- 使用 `@keyframes` 实现激活时的脉冲动画

### 类型安全
- 所有公共 API 都有完整的 TypeScript 类型定义
- 导出类型供外部使用
