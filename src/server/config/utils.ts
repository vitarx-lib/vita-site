import type { UserConfig } from '../../types/index.js'
import { isPlainObject } from '../common/utils.js'

/**
 * 合并两个数组（支持 a / b 为 undefined），返回一个新数组
 *
 * @param a - 第一个数组（可选）
 * @param b - 第二个数组（可选）
 *
 * @returns 返回一个新数组，元素类型为 `E[]`
 *
 * @example
 * mergeArray([1, 2], ['a'])        // => [1, 2, 'a']
 * mergeArray(undefined, ['a'])     // => ['a']
 * mergeArray([1, 2], undefined)   // => [1, 2]
 * mergeArray(undefined, undefined) // => []
 *
 * @remarks
 * - 不会修改原数组
 * - 保持顺序：先 a 后 b
 * - 属于浅合并（不会深拷贝元素）
 * - 时间复杂度 O(n + m)
 */
function mergeTwoArrays<E = any>(a?: readonly any[] | null, b?: any[] | null): E[] {
  // 使用空数组兜底，确保兼容 undefined / null
  const arrA = a ?? []
  const arrB = b ?? []

  return Array.from(new Set([...arrA, ...arrB]))
}

/**
 * 深度合并两个配置对象（不修改原对象）
 *
 * @param defaults - 目标对象
 * @param overrides - 源对象（优先级更高）
 *
 * @returns 合并后的新对象
 *
 * @example
 * mergeTwoObjects(
 *   { a: 1, b: { x: 1 } },
 *   { b: { y: 2 }, c: 3 }
 * )
 * // => { a: 1, b: { x: 1, y: 2 }, c: 3 }
 *
 * @remarks
 * - 不会修改 defaults / overrides（纯函数）
 * - 仅对“普通对象”做深度合并
 * - 数组默认直接覆盖（而不是 concat）
 * - overrides 中的 undefined | null 不会覆盖 defaults（可按需修改策略）
 * - 时间复杂度：O(n)
 */
export function mergeConfig<T = any>(
  defaults: Record<string, any>,
  overrides: Record<string, any> | undefined | null
): T {
  const result: Record<string, any> = { ...defaults }
  if (Object.is(defaults, overrides) || !overrides) return result as T
  for (const key in overrides) {
    if (!Object.prototype.hasOwnProperty.call(overrides, key)) continue

    const sourceValue = overrides[key]
    const targetValue = defaults[key]

    // 忽略 undefined（避免无意义覆盖）
    if (sourceValue === undefined || sourceValue === null) continue

    // 深度合并：仅处理“普通对象”
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = mergeConfig(targetValue, sourceValue)
    } else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      result[key] = mergeTwoArrays(targetValue, sourceValue) as any
    } else {
      // 数组 / 基本类型 / 其他对象：进行浅拷贝后覆盖
      if (Array.isArray(sourceValue)) {
        result[key] = [...sourceValue]
      } else if (isPlainObject(sourceValue)) {
        result[key] = { ...sourceValue }
      } else {
        result[key] = sourceValue
      }
    }
  }

  return result as T
}

/**
 * 定义VitaSite配置对象 - 用于类型推断辅助
 *
 * @param config - VitaSite配置对象
 * @returns 原样返回的配置对象
 *
 * @example
 * ```ts
 * // .vita-site/config.ts
 * export default defineConfig({
 *   title: 'VitaSite',
 *   description: 'A framework for building tech docs with Vitarx 4',
 *   // 其他配置项...
 * })
 * ```
 */
export function defineConfig(config: UserConfig): UserConfig {
  return config
}
