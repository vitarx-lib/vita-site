import { warn } from 'vitarx-router/file-router'
import type { VitaPressPlugin } from '../types/plugin.js'

/**
 * 并行调用插件钩子（异步）
 *
 * 遍历所有插件，并行执行指定钩子函数，统一捕获异常并 warn。
 * 适用于无管道依赖的异步钩子（如 markdown、appCreated、configResolved）。
 *
 * @param plugins - 插件列表
 * @param hookName - 钩子名称
 * @param args - 传递给钩子函数的参数
 */
export async function invokeParallel(
  plugins: readonly VitaPressPlugin[],
  hookName: keyof VitaPressPlugin,
  ...args: unknown[]
): Promise<void> {
  const results: (void | Promise<void>)[] = []
  for (const plugin of plugins) {
    const hook = plugin[hookName]
    if (typeof hook === 'function') {
      try {
        const result = (hook as (...a: unknown[]) => unknown)(...args)
        results.push(result as void | Promise<void>)
      } catch (e) {
        warn(`Plugin ${plugin.name} ${String(hookName)} error:`, e)
      }
    }
  }
  await Promise.all(results)
}

/**
 * 顺序调用插件钩子（同步管道）
 *
 * 遍历所有插件，顺序执行指定钩子函数，前一个钩子的返回值可影响后续处理。
 * 适用于需要管道传递的同步钩子（如 beforeParse、beforeWriteRoutes）。
 *
 * @param plugins - 插件列表
 * @param hookName - 钩子名称
 * @param initialValue - 初始值（作为第一个钩子参数之外的管道输入）
 * @param args - 传递给钩子函数的额外参数
 * @returns 最终处理后的值
 */
export function invokePipe<T>(
  plugins: readonly VitaPressPlugin[],
  hookName: keyof VitaPressPlugin,
  initialValue: T,
  ...args: unknown[]
): T {
  let value = initialValue
  for (const plugin of plugins) {
    const hook = plugin[hookName]
    if (typeof hook === 'function') {
      try {
        const result = (hook as (...a: unknown[]) => unknown)(value, ...args)
        if (result !== undefined && result !== null) {
          value = result as T
        }
      } catch (e) {
        warn(`Plugin ${plugin.name} ${String(hookName)} error:`, e)
      }
    }
  }
  return value
}
