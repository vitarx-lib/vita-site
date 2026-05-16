import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { MdParseResult } from '../../../../src/server/index.js'
import { CacheManager } from '../../../../src/server/markdown/cache/manager.js'

const mockParseResult = {
  html: '<p>test</p>',
  content: 'test',
  filePath: '/docs/test.md',
  meta: {
    title: 'Test',
    tocList: [],
    relativePath: 'docs/test.md',
    authors: [],
    createdAt: '',
    lastUpdateAt: ''
  },
  alias: undefined
} as unknown as MdParseResult

describe('CacheManager', () => {
  let tempDir: string
  let cacheManager: CacheManager

  beforeEach(() => {
    tempDir = join(tmpdir(), `cache-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    cacheManager = new CacheManager(tempDir)
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
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
    it('应能设置和获取缓存', () => {
      const filePath = 'docs/test.md'
      const content = '# Test Content'
      const componentCode = 'export default function() { return "test" }'

      cacheManager.set(filePath, content, componentCode, mockParseResult)

      const cached = cacheManager.get(filePath, content)
      expect(cached).toBeDefined()
      expect(cached!.componentCode).toBe(componentCode)
      expect(cached!.parseResult).toEqual(mockParseResult)
    })

    it('内容变化时应返回 undefined', () => {
      const filePath = 'docs/test.md'
      const content1 = '# Test Content 1'
      const content2 = '# Test Content 2'
      const componentCode = 'export default function() { return "test" }'

      cacheManager.set(filePath, content1, componentCode, mockParseResult)

      const cached = cacheManager.get(filePath, content2)
      expect(cached).toBeUndefined()
    })

    it('未设置缓存时应返回 undefined', () => {
      const cached = cacheManager.get('docs/not-exist.md', '# Test')
      expect(cached).toBeUndefined()
    })

    it('应持久化缓存到磁盘', () => {
      const filePath = 'docs/test.md'
      const content = '# Test Content'
      const componentCode = 'export default function() { return "test" }'

      cacheManager.set(filePath, content, componentCode, mockParseResult)

      const newManager = new CacheManager(tempDir)
      const cached = newManager.get(filePath, content)
      expect(cached).toBeDefined()
      expect(cached!.componentCode).toBe(componentCode)
      expect(cached!.parseResult).toEqual(mockParseResult)
    })

    it('缓存条目应包含正确的 hash、componentPath 和 parseResult', () => {
      const filePath = 'docs/api_test.md'
      const content = '# Test'
      const componentCode = 'export default function() { return "test" }'

      cacheManager.set(filePath, content, componentCode, mockParseResult)

      const jsonFilePath = cacheManager.getCacheFilePath(filePath, 'json')
      expect(existsSync(jsonFilePath)).toBe(true)

      const entry = JSON.parse(readFileSync(jsonFilePath, 'utf-8'))
      expect(entry.hash).toBe(cacheManager.computeHash(content))
      expect(entry.componentPath).toBeDefined()
      expect(entry.componentPath.endsWith('.jsx')).toBe(true)
      expect(entry.parseResult).toEqual(mockParseResult)
    })

    it('应正确读取组件缓存文件', () => {
      const filePath = 'docs/test.md'
      const content = '# Test'
      const componentCode = 'export default function() { return "component" }'

      cacheManager.set(filePath, content, componentCode, mockParseResult)

      const jsonFilePath = cacheManager.getCacheFilePath(filePath, 'json')
      const entry = JSON.parse(readFileSync(jsonFilePath, 'utf-8'))

      const componentContent = readFileSync(entry.componentPath, 'utf-8')
      expect(componentContent).toBe(componentCode)
    })
  })

  describe('clear', () => {
    it('应清除所有缓存', () => {
      const filePath1 = 'docs/test1.md'
      const filePath2 = 'docs/test2.md'
      const content = '# Test'
      const componentCode = 'export default function() { return "test" }'

      cacheManager.set(filePath1, content, componentCode, mockParseResult)
      cacheManager.set(filePath2, content, componentCode, mockParseResult)

      cacheManager.clear()

      expect(existsSync(cacheManager.getCacheFilePath(filePath1, 'json'))).toBe(false)
      expect(existsSync(cacheManager.getCacheFilePath(filePath2, 'json'))).toBe(false)
    })

    it('应删除磁盘上的缓存文件', async () => {
      const filePath = 'docs/test.md'
      const content = '# Test'
      const componentCode = 'export default function() { return "test" }'

      cacheManager.set(filePath, content, componentCode, mockParseResult)

      await new Promise(resolve => setTimeout(resolve, 100))

      cacheManager.clear()

      expect(existsSync(cacheManager.getCacheFilePath(filePath, 'json'))).toBe(false)
      expect(existsSync(cacheManager.getCacheFilePath(filePath, 'jsx'))).toBe(false)
    })

    it('缓存目录不存在时不应报错', () => {
      rmSync(tempDir, { recursive: true, force: true })
      expect(() => cacheManager.clear()).not.toThrow()
    })
  })

  describe('remove', () => {
    it('应删除指定文件的缓存', () => {
      const filePath = 'docs/test.md'
      const content = '# Test'
      const componentCode = 'export default function() { return "test" }'

      cacheManager.set(filePath, content, componentCode, mockParseResult)
      expect(cacheManager.get(filePath, content)).toBeDefined()

      cacheManager.remove(filePath)
      expect(cacheManager.get(filePath, content)).toBeUndefined()
    })

    it('删除不存在的缓存时不应报错', () => {
      expect(() => cacheManager.remove('docs/not-exist.md')).not.toThrow()
    })

    it('应同时删除 json 和 jsx 缓存文件', () => {
      const filePath = 'docs/test.md'
      const content = '# Test'
      const componentCode = 'export default function() { return "test" }'

      cacheManager.set(filePath, content, componentCode, mockParseResult)

      expect(existsSync(cacheManager.getCacheFilePath(filePath, 'json'))).toBe(true)
      expect(existsSync(cacheManager.getCacheFilePath(filePath, 'jsx'))).toBe(true)

      cacheManager.remove(filePath)

      expect(existsSync(cacheManager.getCacheFilePath(filePath, 'json'))).toBe(false)
      expect(existsSync(cacheManager.getCacheFilePath(filePath, 'jsx'))).toBe(false)
    })
  })

  describe('getCacheFilePath', () => {
    it('应正确生成 json 缓存文件路径', () => {
      const filePath = 'docs/test.md'
      const result = cacheManager.getCacheFilePath(filePath, 'json')
      expect(result).toBe(join(tempDir, `${filePath}.json`))
    })

    it('应正确生成 jsx 缓存文件路径', () => {
      const filePath = 'docs/test.md'
      const result = cacheManager.getCacheFilePath(filePath, 'jsx')
      expect(result).toBe(join(tempDir, `${filePath}.jsx`))
    })
  })

  describe('cacheDir', () => {
    it('应暴露 cacheDir 属性', () => {
      expect(cacheManager.cacheDir).toBe(tempDir)
    })
  })
})
