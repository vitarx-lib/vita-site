import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

/**
 * 判断是否为普通对象（排除 null / 数组 / 内置对象等）
 */
export function isPlainObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

/**
 * 获取当前版本号
 *
 * @returns {string} 版本号
 */
export function getVersion(): string {
  try {
    const packageJsonPath = fileURLToPath(new URL('../../../package.json', import.meta.url))
    const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return version
  } catch {
    return '0.0.0'
  }
}

/**
 * 写入缓存文件
 *
 * 自动创建目录
 *
 * @param filePath
 * @param content
 */
export function writeCacheFileSync(filePath: string, content: string) {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    // 创建目录
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(filePath, content, 'utf-8')
}
