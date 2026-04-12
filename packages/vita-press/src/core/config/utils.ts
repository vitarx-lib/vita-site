/**
 * 深度合并多个对象或数组（支持去重合并数组）
 *
 * @param {...any[]} objects 多个对象或数组
 * @returns {any} 合并后的对象或数组
 */
export function mergeConfig(...objects: any[]): any {
  const isObject = (obj: any): obj is Record<string, any> =>
    obj && typeof obj === 'object' && !Array.isArray(obj)

  const isArray = (arr: any): arr is any[] => Array.isArray(arr)

  const mergeTwoObjects = (
    target: Record<string, any>,
    source: Record<string, any>
  ): Record<string, any> => {
    Object.keys(source).forEach(key => {
      const targetValue = target[key]
      const sourceValue = source[key]

      if (isObject(targetValue) && isObject(sourceValue)) {
        target[key] = mergeTwoObjects({ ...targetValue }, sourceValue)
      } else if (isArray(targetValue) && isArray(sourceValue)) {
        target[key] = mergeTwoArrays(targetValue, sourceValue)
      } else {
        target[key] = sourceValue
      }
    })

    return target
  }

  const mergeTwoArrays = (target: any[], source: any[]): any[] => {
    const mergedArray = [...target, ...source]
    return Array.from(new Set(mergedArray))
  }

  return objects.reduce((acc, obj) => {
    if (isObject(acc) && isObject(obj)) {
      return mergeTwoObjects(acc, obj)
    } else if (isArray(acc) && isArray(obj)) {
      return mergeTwoArrays(acc, obj)
    } else {
      return obj
    }
  }, {})
}
