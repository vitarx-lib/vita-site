/**
 * 判断是否为普通对象（排除 null / 数组 / 内置对象等）
 */
export function isPlainObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]'
}
