import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { debug } from 'vitarx-router/file-router'
import type { MdParseResult } from '../parser/parser.js'
import { pathToCacheFileName } from './utils.js'

interface CacheEntry {
  filePath: string
  hash: string
  result: MdParseResult
}

const DEFAULT_CACHE_DIR = '.vitapress/.cache/docs'

/**
 * 缓存管理器
 *
 * 负责管理 Markdown 文件转换结果的持久化缓存。
 * 采用分散文件存储策略，每个源文件对应一个独立的缓存文件，
 * 避免单文件过大导致的内存问题。
 */
export class CacheManager {
  private readonly cacheDir: string
  private readonly root: string
  private readonly memoryCache: Map<string, CacheEntry> = new Map()
  private readonly hash: string

  /**
   * 创建缓存管理器
   *
   * @param root - 项目根目录
   * @param hash - 额外的缓存哈希值
   */
  constructor(root: string, hash: string = '') {
    this.root = root
    this.cacheDir = path.resolve(root, DEFAULT_CACHE_DIR)
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
  get(filePath: string, content: string): MdParseResult | undefined {
    const hash = this.computeHash(content)

    const memoryEntry = this.memoryCache.get(filePath)
    if (memoryEntry && memoryEntry.hash === hash) {
      return memoryEntry.result
    }

    const cacheFile = this.getCacheFilePath(filePath)
    if (!existsSync(cacheFile)) return undefined

    try {
      const fileContent = require('fs').readFileSync(cacheFile, 'utf-8')
      const entry: CacheEntry = JSON.parse(fileContent)

      if (entry.hash !== hash) return undefined

      this.memoryCache.set(filePath, entry)
      return entry.result
    } catch {
      return undefined
    }
  }

  /**
   * 设置缓存
   *
   * 更新内存缓存并异步写入磁盘。
   *
   * @param filePath - 文件相对路径
   * @param content - 文件内容
   * @param result - 转换结果
   */
  set(filePath: string, content: string, result: MdParseResult): void {
    const hash = this.computeHash(content)
    const entry: CacheEntry = { filePath, hash, result }

    this.memoryCache.set(filePath, entry)

    const cacheFile = this.getCacheFilePath(filePath)
    fs.writeFile(cacheFile, JSON.stringify(entry)).catch(e => {
      debug('[CacheManager] Error writing cache file:', e instanceof Error ? e.message : String(e))
    })
  }

  /**
   * 清理失效缓存
   *
   * 删除源文件已不存在的缓存条目。
   *
   * @returns 清理的缓存条目数量
   */
  prune(): number {
    let prunedCount = 0

    try {
      const cacheFiles = readdirSync(this.cacheDir)

      for (const cacheFileName of cacheFiles) {
        const cacheFilePath = path.join(this.cacheDir, cacheFileName)
        let filePath: string | undefined
        try {
          const fileContent = readFileSync(cacheFilePath, 'utf-8')
          const entry: CacheEntry = JSON.parse(fileContent)
          filePath = entry.filePath
        } catch {
          unlinkSync(cacheFilePath)
          prunedCount++
          continue
        }

        if (!filePath) {
          unlinkSync(cacheFilePath)
          prunedCount++
          continue
        }

        const sourceFile = path.join(this.root, filePath)
        if (!existsSync(sourceFile)) {
          unlinkSync(cacheFilePath)
          this.memoryCache.delete(filePath)
          prunedCount++
        }
      }
    } catch {
      // 目录不存在或读取失败，忽略
    }

    return prunedCount
  }

  /**
   * 清理所有缓存
   */
  clear(): void {
    this.memoryCache.clear()

    try {
      const cacheFiles = readdirSync(this.cacheDir)
      for (const file of cacheFiles) {
        unlinkSync(path.join(this.cacheDir, file))
      }
    } catch {
      // 目录不存在，忽略
    }
  }

  /**
   * 获取缓存文件完整路径
   *
   * @param filePath - 文件相对路径
   * @returns 缓存文件完整路径
   */
  private getCacheFilePath(filePath: string): string {
    return path.join(this.cacheDir, pathToCacheFileName(filePath))
  }
}
