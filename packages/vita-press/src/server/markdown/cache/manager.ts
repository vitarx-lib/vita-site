import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { debug } from 'vitarx-router/file-router'
import { writeCacheFileSync } from './utils.js'

interface EntryInfo {
  hash: string
  mdPath: string
  componentPath: string
}

/**
 * 缓存管理器
 *
 * 负责管理 Markdown 文件转换结果的持久化缓存。
 * 采用分散文件存储策略，每个源文件对应一个独立的缓存文件，
 * 避免单文件过大导致的内存问题。
 */
export class CacheManager {
  public readonly cacheDir: string
  private readonly hash: string

  /**
   * 创建缓存管理器
   *
   * @param cacheDir - 缓存目录
   * @param hash - 额外的缓存哈希值
   */
  constructor(cacheDir: string, hash: string = '') {
    /**
     * 缓存目录
     */
    this.cacheDir = cacheDir
    // 创建缓存目录
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true })
    }
    this.hash = hash
  }

  /**
   * 计算内容的 MD5 hash 值
   *
   * @param content - 文件内容
   * @returns hash 字符串
   */
  computeHash(content: string): string {
    return createHash('md5').update(`${this.hash}_${content}`).digest('hex')
  }

  /**
   * 获取缓存
   *
   * 优先从内存缓存获取，内存未命中则从磁盘加载。
   *
   * @param filePath - 文件相对路径
   * @param content - 文件内容
   * @returns 缓存结果或 undefined
   */
  get(filePath: string, content: string): string | undefined {
    const hash = this.computeHash(content)

    const cacheFile = this.getCacheFilePath(filePath, 'json')
    if (!existsSync(cacheFile)) return undefined

    try {
      const fileContent = readFileSync(cacheFile, 'utf-8')
      const entry: EntryInfo = JSON.parse(fileContent)
      if (entry.hash !== hash) return undefined
      return readFileSync(entry.componentPath, 'utf-8')
    } catch {
      return undefined
    }
  }

  /**
   * 设置缓存
   *
   * 更新内存缓存并同步写入磁盘。
   *
   * @param mdPath - 文档相对路径
   * @param rawContent - 文件原始内容
   * @param componentCode - 组件代码
   */
  set(mdPath: string, rawContent: string, componentCode: string): void {
    const hash = this.computeHash(rawContent)
    const entry: EntryInfo = { mdPath, hash, componentPath: this.getCacheFilePath(mdPath, 'jsx') }

    const entryPath = this.getCacheFilePath(mdPath, 'json')
    try {
      // 写入缓存文件
      writeCacheFileSync(entryPath, JSON.stringify(entry))
      // 写入组件缓存
      writeCacheFileSync(entry.componentPath, componentCode)
    } catch (e) {
      debug('[CacheManager] Error writing cache file:', e)
    }
  }

  /**
   * 清理所有缓存
   */
  clear(): void {
    try {
      // 删除缓存目录及其所有文件
      if (existsSync(this.cacheDir)) {
        rmSync(this.cacheDir, { recursive: true, force: true })
      }
    } catch (e) {
      debug('[CacheManager] Error clearing cache:', e)
    }
  }

  /**
   * 删除指定文件的缓存
   *
   * @param mdPath - md文件相对路径
   */
  remove(mdPath: string): void {
    const infoPath = this.getCacheFilePath(mdPath, 'json')
    if (existsSync(infoPath)) {
      try {
        const entry: EntryInfo = JSON.parse(readFileSync(infoPath, 'utf-8'))
        unlinkSync(entry.componentPath)
        unlinkSync(infoPath)
      } catch (e) {
        debug('[CacheManager] Error removing cache file:', e)
      }
    }
  }

  /**
   * 获取缓存文件完整路径
   *
   * @param mdPath - 文件相对路径
   * @param ext - 文件扩展名
   * @returns 缓存文件完整路径
   */
  public getCacheFilePath(mdPath: string, ext: 'json' | 'jsx'): string {
    return path.join(this.cacheDir, `${mdPath}.${ext}`)
  }
}
