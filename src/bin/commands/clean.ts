import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { error, info } from 'vitarx-router/file-router'

/**
 * 清理缓存
 *
 * @param silence - 是否静默模式
 */
export function cleanCommandHandler(silence: boolean = false): void {
  try {
    const cacheDir = resolve(process.cwd(), '.vita-site/.cache')
    // 删除缓存目录及其所有文件
    if (existsSync(cacheDir)) {
      rmSync(cacheDir, { recursive: true, force: true })
    }
    const tempDir = resolve(process.cwd(), '.vita-site/.temp')
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    if (!silence) info('Cache cleared')
  } catch (e) {
    error('Cache clear failed:', e)
  }
}
