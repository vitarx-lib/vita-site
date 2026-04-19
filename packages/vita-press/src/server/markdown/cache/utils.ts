import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

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
