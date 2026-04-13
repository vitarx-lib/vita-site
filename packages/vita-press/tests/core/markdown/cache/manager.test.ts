import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CacheManager } from '../../../../src/core/markdown/cache/manager.js'
import type { MdParseResult } from '../../../../src/core/markdown/parser/index.js'

describe('CacheManager', () => {
  let tempDir: string
  let cacheManager: CacheManager
  const cacheDirPath = '.vitapress/.cache/markdown'

  const mockResult: MdParseResult = {
    content: 'export default function() { return "test" }',
    filePath: '/project/docs/test.md',
    meta: {
      order: 0,
      authors: ['test-author'],
      createdAt: '2024-01-01T00:00:00+08:00',
      lastUpdateAt: '2024-01-01T00:00:00+08:00',
      tocList: [],
      relativePath: 'docs/test.md'
    }
  }

  beforeEach(() => {
    tempDir = join(tmpdir(), `cache-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    cacheManager = new CacheManager(tempDir)
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  describe('init', () => {
    it('应创建缓存目录', () => {
      cacheManager.init()
      const cacheDir = join(tempDir, cacheDirPath)
      expect(existsSync(cacheDir)).toBe(true)
    })

    it('重复调用不应报错', () => {
      cacheManager.init()
      cacheManager.init()
      const cacheDir = join(tempDir, cacheDirPath)
      expect(existsSync(cacheDir)).toBe(true)
    })
  })

  describe('computeHash', () => {
    it('应对相同内容生成相同的 hash', () => {
      const content = 'test content'
      const hash1 = cacheManager.computeHash(content)
      const hash2 = cacheManager.computeHash(content)
      expect(hash1).toBe(hash2)
    })

    it('应对不同内容生成不同的 hash', () => {
      const hash1 = cacheManager.computeHash('content 1')
      const hash2 = cacheManager.computeHash('content 2')
      expect(hash1).not.toBe(hash2)
    })

    it('应生成 32 位 MD5 hash', () => {
      const hash = cacheManager.computeHash('test')
      expect(hash).toHaveLength(32)
    })

    it('不同 hash 参数应生成不同的 hash', () => {
      const manager1 = new CacheManager(tempDir, 'hash1')
      const manager2 = new CacheManager(tempDir, 'hash2')
      const content = 'test content'

      const hash1 = manager1.computeHash(content)
      const hash2 = manager2.computeHash(content)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('get and set', () => {
    beforeEach(() => {
      cacheManager.init()
    })

    it('应能设置和获取缓存', () => {
      const filePath = 'docs/test.md'
      const content = '# Test Content'

      cacheManager.set(filePath, content, mockResult)

      const cached = cacheManager.get(filePath, content)
      expect(cached).toBeDefined()
      expect(cached?.content).toBe(mockResult.content)
      expect(cached?.meta.relativePath).toBe(mockResult.meta.relativePath)
    })

    it('内容变化时应返回 undefined', () => {
      const filePath = 'docs/test.md'
      const content1 = '# Test Content 1'
      const content2 = '# Test Content 2'

      cacheManager.set(filePath, content1, mockResult)

      const cached = cacheManager.get(filePath, content2)
      expect(cached).toBeUndefined()
    })

    it('未设置缓存时应返回 undefined', () => {
      const cached = cacheManager.get('docs/not-exist.md', '# Test')
      expect(cached).toBeUndefined()
    })

    it('应持久化缓存到磁盘', async () => {
      const filePath = 'docs/test.md'
      const content = '# Test Content'

      cacheManager.set(filePath, content, mockResult)

      await new Promise(resolve => setTimeout(resolve, 100))

      const newManager = new CacheManager(tempDir)
      const cached = newManager.get(filePath, content)
      expect(cached).toBeDefined()
      expect(cached?.content).toBe(mockResult.content)
    })

    it('缓存条目应包含正确的 filePath', async () => {
      const filePath = 'docs/api_test.md'
      const content = '# Test'

      cacheManager.set(filePath, content, mockResult)

      await new Promise(resolve => setTimeout(resolve, 100))

      const cacheDir = join(tempDir, cacheDirPath)
      const files = readdirSync(cacheDir)
      expect(files.length).toBe(1)

      const cacheFile = join(cacheDir, files[0]!)
      const entry = JSON.parse(require('fs').readFileSync(cacheFile, 'utf-8'))
      expect(entry.filePath).toBe(filePath)
    })
  })

  describe('prune', () => {
    beforeEach(() => {
      cacheManager.init()
    })

    const setupCacheWithSourceFile = async (deleteSource = false) => {
      const sourceFile = join(tempDir, 'docs', 'test.md')
      mkdirSync(join(tempDir, 'docs'), { recursive: true })
      writeFileSync(sourceFile, '# Test')

      const filePath = 'docs/test.md'
      const content = '# Test'
      cacheManager.set(filePath, content, mockResult)

      await new Promise(resolve => setTimeout(resolve, 100))

      if (deleteSource) {
        rmSync(sourceFile)
      }

      return { filePath, content }
    }

    it('应删除源文件不存在的缓存', async () => {
      const { filePath, content } = await setupCacheWithSourceFile(true)

      expect(cacheManager.prune()).toBe(1)
      expect(cacheManager.get(filePath, content)).toBeUndefined()
    })

    it('应保留源文件存在的缓存', async () => {
      const { filePath, content } = await setupCacheWithSourceFile(false)

      expect(cacheManager.prune()).toBe(0)
      expect(cacheManager.get(filePath, content)).toBeDefined()
    })

    it('应删除无法解析的缓存文件', async () => {
      const cacheDir = join(tempDir, cacheDirPath)
      const invalidCacheFile = join(cacheDir, 'invalid.json')
      writeFileSync(invalidCacheFile, 'invalid json content')

      const prunedCount = cacheManager.prune()
      expect(prunedCount).toBe(1)
      expect(existsSync(invalidCacheFile)).toBe(false)
    })

    it('应删除缺少 filePath 的缓存文件', async () => {
      const cacheDir = join(tempDir, cacheDirPath)
      const invalidCacheFile = join(cacheDir, 'no-path.json')
      writeFileSync(invalidCacheFile, JSON.stringify({ hash: 'abc', result: mockResult }))

      const prunedCount = cacheManager.prune()
      expect(prunedCount).toBe(1)
      expect(existsSync(invalidCacheFile)).toBe(false)
    })

    it('缓存目录不存在时应返回 0', () => {
      rmSync(join(tempDir, cacheDirPath), { recursive: true, force: true })
      const prunedCount = cacheManager.prune()
      expect(prunedCount).toBe(0)
    })
  })

  describe('clear', () => {
    beforeEach(() => {
      cacheManager.init()
    })

    it('应清除所有缓存', async () => {
      const filePath1 = 'docs/test1.md'
      const filePath2 = 'docs/test2.md'
      const content = '# Test'

      cacheManager.set(filePath1, content, mockResult)
      cacheManager.set(filePath2, content, mockResult)

      await new Promise(resolve => setTimeout(resolve, 100))

      cacheManager.clear()

      expect(cacheManager.get(filePath1, content)).toBeUndefined()
      expect(cacheManager.get(filePath2, content)).toBeUndefined()
    })

    it('应删除磁盘上的缓存文件', async () => {
      const filePath = 'docs/test.md'
      const content = '# Test'

      cacheManager.set(filePath, content, mockResult)

      await new Promise(resolve => setTimeout(resolve, 100))

      cacheManager.clear()

      const cacheDir = join(tempDir, cacheDirPath)
      const files = existsSync(cacheDir) ? readdirSync(cacheDir) : []
      expect(files.length).toBe(0)
    })

    it('缓存目录不存在时不应报错', () => {
      rmSync(join(tempDir, cacheDirPath), { recursive: true, force: true })
      expect(() => cacheManager.clear()).not.toThrow()
    })
  })
})
