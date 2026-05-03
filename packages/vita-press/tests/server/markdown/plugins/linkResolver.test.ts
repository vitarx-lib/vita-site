import MarkdownIt from 'markdown-it'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { linkResolver } from '../../../../src/server/markdown/plugins/linkResolver.js'

const MOCK_FILE_PATH = '/project/docs/guide/getting-started.md'

type GetRouteFullPath = (filePath: string) => string | null

function createMarkdownWithLinkResolver(getRouteFullPath: GetRouteFullPath = vi.fn()): MarkdownIt {
  const md = new MarkdownIt()
  md.use(linkResolver)
  ;(md as any).__getRouteFullPath = getRouteFullPath
  return md
}

function renderWithEnv(md: MarkdownIt, content: string, filePath: string = MOCK_FILE_PATH): string {
  const getRouteFullPath = (md as any).__getRouteFullPath as GetRouteFullPath
  const env = {
    app: {
      router: { getRouteFullPath }
    },
    filePath
  }
  return md.render(content, env)
}

function parseWithEnv(md: MarkdownIt, content: string, filePath: string = MOCK_FILE_PATH) {
  const getRouteFullPath = (md as any).__getRouteFullPath as GetRouteFullPath
  const env = {
    app: {
      router: { getRouteFullPath }
    },
    filePath
  }
  return md.parse(content, env)
}

function findLinkOpenToken(tokens: ReturnType<MarkdownIt['parse']>, index: number = 0) {
  let count = 0
  for (const token of tokens) {
    if (!token.children) continue
    for (const child of token.children) {
      if (child.type === 'link_open') {
        if (count === index) return child
        count++
      }
    }
  }
  return null
}

describe('linkResolver', () => {
  let getRouteFullPath: GetRouteFullPath

  beforeEach(() => {
    getRouteFullPath = vi.fn()
  })

  describe('内部链接解析', () => {
    it('应将匹配路由的链接路径替换为路由路径', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/guide/intro.md' ? '/guide/intro' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[简介](./intro.md)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('/guide/intro')
      expect(getRouteFullPath).toHaveBeenCalledWith('/project/docs/guide/intro.md')
    })

    it('应在路由不可用时保留原始链接', () => {
      getRouteFullPath = vi.fn(() => null)
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[未知](./unknown.md)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('./unknown.md')
    })

    it('应正确解析上级目录相对路径', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/api.md' ? '/api' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[API](../api.md)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('/api')
      expect(getRouteFullPath).toHaveBeenCalledWith('/project/docs/api.md')
    })

    it('应正确解析绝对文件路径', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/guide/advanced.md' ? '/guide/advanced' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[进阶](./advanced.md)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('/guide/advanced')
    })
  })

  describe('哈希片段处理', () => {
    it('应保留链接中的哈希片段', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/guide/intro.md' ? '/guide/intro' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[简介](./intro.md#installation)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('/guide/intro#installation')
    })

    it('应在路由不可用时保留原始链接和哈希', () => {
      getRouteFullPath = vi.fn(() => null)
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[未知](./unknown.md#section)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('./unknown.md#section')
    })

    it('应处理仅哈希的锚点链接', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[章节](#section)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('#section')
      expect(getRouteFullPath).not.toHaveBeenCalled()
    })

    it('应处理多个哈希片段', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/guide/intro.md' ? '/guide/intro' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[简介](./intro.md#setup#config)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('/guide/intro#setup#config')
    })
  })

  describe('外部链接', () => {
    it('应跳过 https 链接', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[GitHub](https://github.com)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('https://github.com')
      expect(getRouteFullPath).not.toHaveBeenCalled()
    })

    it('应跳过 http 链接', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[示例](http://example.com)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('http://example.com')
      expect(getRouteFullPath).not.toHaveBeenCalled()
    })

    it('应跳过协议相对链接', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[CDN](//cdn.example.com/lib.js)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('//cdn.example.com/lib.js')
      expect(getRouteFullPath).not.toHaveBeenCalled()
    })

    it('应跳过带路径的外部链接', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[文档](https://vitarx.cn/guide)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('https://vitarx.cn/guide')
      expect(getRouteFullPath).not.toHaveBeenCalled()
    })
  })

  describe('特殊协议链接', () => {
    it('应跳过 mailto 链接', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[邮箱](mailto:test@example.com)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('mailto:test@example.com')
      expect(getRouteFullPath).not.toHaveBeenCalled()
    })

    it('应跳过 tel 链接', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[电话](tel:+861234567890)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('tel:+861234567890')
      expect(getRouteFullPath).not.toHaveBeenCalled()
    })
  })

  describe('env 上下文缺失', () => {
    it('env 为空对象时不应报错', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      expect(() => md.render('[链接](./page.md)', {})).not.toThrow()
    })

    it('env 为 undefined 时不应报错', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      expect(() => md.render('[链接](./page.md)', undefined as any)).not.toThrow()
    })

    it('缺少 app 时不应调用 getRouteFullPath', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      md.render('[链接](./page.md)', { filePath: MOCK_FILE_PATH })

      expect(getRouteFullPath).not.toHaveBeenCalled()
    })

    it('缺少 router 时不应调用 getRouteFullPath', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      md.render('[链接](./page.md)', { app: {}, filePath: MOCK_FILE_PATH } as any)

      expect(getRouteFullPath).not.toHaveBeenCalled()
    })

    it('缺少 filePath 时不应调用 getRouteFullPath', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      md.render('[链接](./page.md)', { app: { router: { getRouteFullPath } } } as any)

      expect(getRouteFullPath).not.toHaveBeenCalled()
    })
  })

  describe('多链接处理', () => {
    it('应正确处理文档中的多个链接', () => {
      getRouteFullPath = vi.fn((filePath: string) => {
        if (filePath === '/project/docs/guide/intro.md') return '/guide/intro'
        if (filePath === '/project/docs/api.md') return '/api'
        return null
      })
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(
        md,
        '[简介](./intro.md) 和 [API](../api.md) 和 [未知](./unknown.md)'
      )

      const link1 = findLinkOpenToken(tokens, 0)
      const link2 = findLinkOpenToken(tokens, 1)
      const link3 = findLinkOpenToken(tokens, 2)

      expect(link1?.attrGet('href')).toBe('/guide/intro')
      expect(link2?.attrGet('href')).toBe('/api')
      expect(link3?.attrGet('href')).toBe('./unknown.md')
    })

    it('应正确处理外部链接与内部链接混合', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/guide/intro.md' ? '/guide/intro' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[内部](./intro.md) 和 [外部](https://example.com)')

      const link1 = findLinkOpenToken(tokens, 0)
      const link2 = findLinkOpenToken(tokens, 1)

      expect(link1?.attrGet('href')).toBe('/guide/intro')
      expect(link2?.attrGet('href')).toBe('https://example.com')
    })
  })

  describe('边界情况', () => {
    it('应处理无链接的文档', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const html = renderWithEnv(md, '普通文本内容')

      expect(html).toContain('普通文本内容')
      expect(getRouteFullPath).not.toHaveBeenCalled()
    })

    it('应处理空文档', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const html = renderWithEnv(md, '')

      expect(html).toBe('')
    })

    it('应处理空链接地址', () => {
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[链接]()')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('')
      expect(getRouteFullPath).not.toHaveBeenCalled()
    })

    it('应处理不同目录下的文件路径', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/advanced/deep.md' ? '/advanced/deep' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '[深层](../advanced/deep.md)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('/advanced/deep')
      expect(getRouteFullPath).toHaveBeenCalledWith('/project/docs/advanced/deep.md')
    })
  })

  describe('与其他 Markdown 语法共存', () => {
    it('应在标题中正确工作', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/guide/intro.md' ? '/guide/intro' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '## [简介](./intro.md)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('/guide/intro')
    })

    it('应在列表中正确工作', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/guide/intro.md' ? '/guide/intro' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '- [简介](./intro.md)\n- [外部](https://example.com)')

      const link1 = findLinkOpenToken(tokens, 0)
      const link2 = findLinkOpenToken(tokens, 1)

      expect(link1?.attrGet('href')).toBe('/guide/intro')
      expect(link2?.attrGet('href')).toBe('https://example.com')
    })

    it('应在引用中正确工作', () => {
      getRouteFullPath = vi.fn((filePath: string) =>
        filePath === '/project/docs/guide/intro.md' ? '/guide/intro' : null
      )
      const md = createMarkdownWithLinkResolver(getRouteFullPath)
      const tokens = parseWithEnv(md, '> 参考 [简介](./intro.md)')

      const linkToken = findLinkOpenToken(tokens)
      expect(linkToken?.attrGet('href')).toBe('/guide/intro')
    })
  })
})
