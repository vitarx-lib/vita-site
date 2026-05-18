/**
 * 从 injectCode 语句中提取导入的标识符名称
 *
 * 支持的 import 形式：
 * - 具名导入: import { Button, Card as C } from "xxx" → ["Button", "C"]
 * - 默认导入: import MyComponent from "xxx" → ["MyComponent"]
 *
 * 非标准 import 语句会被静默跳过，不影响结果。
 *
 * @param injectCode - injectCode 配置数组
 * @returns 导入的标识符名称集合
 */
export function extractImportNames(injectCode: readonly string[]): Set<string> {
  const names = new Set<string>()
  const namedImportRe = /^\s*import\s*\{([^}]*)\}\s*from\s*['"][^'"]*['"]\s*;?\s*$/
  const defaultImportRe = /^\s*import\s+(\w+)\s+from\s*['"][^'"]*['"]\s*;?\s*$/

  for (const line of injectCode) {
    const namedMatch = line.match(namedImportRe)
    if (namedMatch) {
      namedMatch[1]!.split(',').forEach(part => {
        const segment = part.trim()
        if (!segment) return
        const asMatch = segment.match(/\s+as\s+(\w+)\s*$/)
        names.add(asMatch ? asMatch[1]! : segment.split(/\s+/)[0]!)
      })
      continue
    }

    const defaultMatch = line.match(defaultImportRe)
    if (defaultMatch) {
      names.add(defaultMatch[1]!)
    }
  }

  return names
}
