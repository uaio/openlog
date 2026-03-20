// packages/vconsole/src/ui/FloatingBall.ts

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
  private hasMoved = false; // 追踪是否真的发生了拖动

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
    this.hasMoved = false; // 重置移动标志
    this.element.classList.add('dragging');
    this.element.classList.remove(`snapped-${this.snappedSide}`);
    this.snappedSide = null;
  }

  /**
   * 处理拖拽移动
   */
  private handleDragMove(x: number, y: number): void {
    this.hasMoved = true; // 标记已移动
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

    // 延迟重置移动标志，确保 click 事件能读取到正确的值
    setTimeout(() => {
      this.hasMoved = false;
    }, 0);
  }

  /**
   * 处理点击
   */
  private handleClick(): void {
    // 如果发生了拖动，不处理点击
    if (this.hasMoved) {
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
