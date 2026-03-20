/**
 * 拖拽处理器
 * 处理鼠标和触摸事件的拖拽逻辑
 */

export type Edge = 'left' | 'right' | 'top' | 'bottom';

export interface DragHandlerOptions {
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (edge: Edge | null) => void;
  snapThreshold?: number; // 吸附阈值（px），默认 20
}

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
