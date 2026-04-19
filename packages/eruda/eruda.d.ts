/**
 * Type definitions for Eruda
 * @see https://github.com/liriliri/eruda
 */
declare module 'eruda' {
  export interface InitDefaults {
    transparency?: number
    displaySize?: number
    theme?: string
  }

  export interface InitOptions {
    container?: HTMLElement
    tool?: string[]
    autoScale?: boolean
    useShadowDom?: boolean
    inline?: boolean
    defaults?: InitDefaults
  }

  export interface Position {
    x: number
    y: number
  }

  type AnyFn = (...args: any[]) => any

  export interface Emitter {
    on(event: string, listener: AnyFn): Emitter
    off(event: string, listener: AnyFn): Emitter
    once(event: string, listener: AnyFn): Emitter
    emit(event: string, ...args: any[]): Emitter
    removeAllListeners(event?: string): Emitter
  }

  export interface Tool {
    name: string
    init(el: unknown): void
    show(): Tool | undefined
    hide(): Tool | undefined
    destroy(): void
  }

  export interface ToolConstructor {
    new (): Tool
    readonly prototype: Tool
    extend(tool: Tool): ToolConstructor
  }

  export interface ErudaConsole extends Tool, Console {
    config: {
      set(name: string, value: any): void
    }
    filter(pattern: string | RegExp | ((log: any) => boolean)): void
    html(htmlStr: string): void
  }

  export interface ErudaConsoleConstructor {
    new (): ErudaConsole
    readonly prototype: ErudaConsole
  }

  export interface DevTools extends Emitter {
    show(): DevTools
    hide(): DevTools
    toggle(): void
    add(tool: Tool | object): DevTools
    remove(name: string): DevTools
    removeAll(): DevTools
    get<T extends ToolConstructor>(name: string): InstanceType<T> | undefined
    showTool(name: string): DevTools
    destroy(): void
  }

  export interface Util {
    evalCss(css: string): HTMLStyleElement
    isErudaEl(val: any): boolean
    isDarkTheme(theme?: string): boolean
    getTheme(): string
  }

  export interface ErudaApis {
    init(options?: InitOptions): void
    destroy(): void
    scale(): number
    scale(s: number): Eruda
    position(): Position
    position(p: Position): Eruda
    get(name: string): any
    get(): any
    add(tool: any): Eruda | undefined
    remove(name: string): Eruda | undefined
    show(name?: string): Eruda | undefined
    hide(): Eruda | undefined
  }

  export interface Eruda extends ErudaApis {
    Console: ErudaConsoleConstructor
    Tool: ToolConstructor
    util: Util
    readonly version: string
  }

  const eruda: Eruda
  export default eruda
}
