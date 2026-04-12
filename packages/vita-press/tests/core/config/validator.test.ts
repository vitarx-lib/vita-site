import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { UserConfig } from '../../../src/core/config/../../../src/core/types/config.js'
import { ConfigValidationError, validateConfig } from '../../../src/core/config/validator.js'

describe('ConfigValidator', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(process.cwd(), 'temp-test-validator-' + Date.now())
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('validateConfig', () => {
    it('应通过空配置验证', () => {
      const config: UserConfig = {}
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应通过有效的文档目录', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })

      const config: UserConfig = { docDir: 'docs' }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在文档目录不存在时抛出错误', () => {
      const config: UserConfig = { docDir: 'non-existent-docs' }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/文档目录不存在/)
    })
  })

  describe('validateBasicFields', () => {
    it('应通过有效的字符串字段', () => {
      const config: UserConfig = {
        title: 'Test Site',
        description: 'Test Description',
        keywords: 'test, keywords'
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在 title 类型无效时抛出错误', () => {
      const config = { title: 123 as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/title 必须是字符串类型/)
    })

    it('应在 description 类型无效时抛出错误', () => {
      const config = { description: [] as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/description 必须是字符串类型/)
    })

    it('应在 keywords 类型无效时抛出错误', () => {
      const config = { keywords: {} as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/keywords 必须是字符串类型/)
    })
  })

  describe('validateInjectOptions', () => {
    it('应通过有效的注入选项', () => {
      const config: UserConfig = {
        injectHead: ['<link rel="stylesheet" href="test.css">'],
        injectBody: ['<script>console.log("test")</script>'],
        injectCode: ['import { Button } from "components"']
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在 injectHead 类型无效时抛出错误', () => {
      const config = { injectHead: 'invalid' as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/injectHead 必须是数组类型/)
    })

    it('应在 injectHead 元素类型无效时抛出错误', () => {
      const config = { injectHead: [123] as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/injectHead\[0] 必须是字符串类型/)
    })

    it('应在 injectBody 类型无效时抛出错误', () => {
      const config = { injectBody: {} as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/injectBody 必须是数组类型/)
    })

    it('应在 injectCode 类型无效时抛出错误', () => {
      const config = { injectCode: 123 as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/injectCode 必须是数组类型/)
    })
  })

  describe('validatePageDirs', () => {
    it('应通过有效的页面目录（字符串格式）', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })

      const config: UserConfig = {
        pageDirs: ['pages']
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应通过有效的页面目录（对象格式）', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })

      const config: UserConfig = {
        pageDirs: [
          {
            dir: 'pages',
            prefix: '/app',
            include: ['**/*.tsx'],
            exclude: ['**/test/**'],
            group: true
          }
        ]
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在页面目录不存在时抛出错误', () => {
      const config: UserConfig = {
        pageDirs: ['non-existent-pages']
      }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/页面目录不存在/)
    })

    it('应在 pageDirs[].dir 为空时抛出错误', () => {
      const config = {
        pageDirs: [{ dir: '' }] as any
      }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/pageDirs\[0].dir 不能为空/)
    })

    it('应在 pageDirs[].prefix 类型无效时抛出错误', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })

      const config = {
        pageDirs: [{ dir: 'pages', prefix: 123 }] as any
      }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/pageDirs\[0].prefix 必须是字符串类型/)
    })

    it('应在 pageDirs[].include 类型无效时抛出错误', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })

      const config = {
        pageDirs: [{ dir: 'pages', include: 'invalid' }] as any
      }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/pageDirs\[0].include 必须是数组类型/)
    })
  })

  describe('validateLanguages', () => {
    it('应通过有效的多语言配置', () => {
      const docsDir = join(tempDir, 'docs')
      const zhDir = join(docsDir, 'zh')
      const enDir = join(docsDir, 'en')
      mkdirSync(zhDir, { recursive: true })
      mkdirSync(enDir, { recursive: true })

      const config: UserConfig = {
        docDir: 'docs',
        languages: [
          { id: 'zh', name: '中文' },
          { id: 'en', name: 'English' }
        ]
      }

      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在语言 ID 为空时抛出错误', () => {
      const config: UserConfig = {
        languages: [{ id: '', name: '中文' }]
      }

      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/languages\[0].id 必须是非空字符串/)
    })

    it('应在语言 name 为空时抛出错误', () => {
      const config: UserConfig = {
        languages: [{ id: 'zh', name: '' }]
      }

      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/languages\[0].name 必须是非空字符串/)
    })

    it('应在语言 ID 重复时抛出错误', () => {
      const config: UserConfig = {
        languages: [
          { id: 'zh', name: '中文' },
          { id: 'zh', name: '中文' }
        ]
      }

      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/语言 ID 重复/)
    })

    it('应在语言目录不存在时抛出错误', () => {
      const docsDir = join(tempDir, 'docs')
      mkdirSync(docsDir, { recursive: true })

      const config: UserConfig = {
        docDir: 'docs',
        languages: [
          { id: 'zh', name: '中文' },
          { id: 'en', name: 'English' }
        ]
      }

      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/语言目录不存在/)
    })
  })

  describe('validateTheme', () => {
    it('应通过有效的主题入口文件', () => {
      const entryFile = join(tempDir, 'theme-entry.tsx')
      writeFileSync(entryFile, 'export default function Theme() {}')

      const config: UserConfig = {
        theme: {
          entry: 'theme-entry.tsx'
        }
      }

      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在主题入口文件不存在时抛出错误', () => {
      const config: UserConfig = {
        theme: {
          entry: 'non-existent-entry.tsx'
        }
      }

      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/主题入口文件不存在/)
    })

    it('应通过有效的主题布局文件', () => {
      const layoutFile = join(tempDir, 'layout.tsx')
      writeFileSync(layoutFile, 'export default function Layout() {}')

      const config: UserConfig = {
        theme: {
          layout: 'layout.tsx'
        }
      }

      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在主题布局文件不存在时抛出错误', () => {
      const config: UserConfig = {
        theme: {
          layout: 'non-existent-layout.tsx'
        }
      }

      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/主题布局文件不存在/)
    })

    it('应通过有效的主题首页文件', () => {
      const homeFile = join(tempDir, 'home.tsx')
      writeFileSync(homeFile, 'export default function Home() {}')

      const config: UserConfig = {
        theme: {
          home: 'home.tsx'
        }
      }

      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在主题首页文件不存在时抛出错误', () => {
      const config: UserConfig = {
        theme: {
          home: 'non-existent-home.tsx'
        }
      }

      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/主题首页文件不存在/)
    })

    it('应通过有效的主题注入选项', () => {
      const config: UserConfig = {
        theme: {
          injectHead: ['<link rel="stylesheet">'],
          injectBody: ['<script>test</script>'],
          injectCode: ['import Test from "test"']
        }
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在主题注入选项类型无效时抛出错误', () => {
      const config = {
        theme: {
          injectHead: 'invalid'
        }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/theme.injectHead 必须是数组类型/)
    })

    it('应通过有效的主题数据', () => {
      const config: UserConfig = {
        theme: {
          data: {
            nav: ['home', 'about'],
            footer: { text: 'Copyright' }
          }
        }
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在主题数据类型无效时抛出错误', () => {
      const config = {
        theme: {
          data: 'invalid'
        }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/theme.data 必须是对象类型/)
    })

    it('应在主题数据不可序列化时抛出错误', () => {
      const circular: any = { name: 'test' }
      circular.self = circular

      const config = {
        theme: {
          data: circular
        }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/theme.data 必须是可序列化的对象/)
    })
  })

  describe('validateSort', () => {
    it('应通过有效的排序值', () => {
      const configAsc: UserConfig = { sort: 'asc' }
      const configDesc: UserConfig = { sort: 'desc' }

      expect(() => validateConfig(configAsc, tempDir)).not.toThrow()
      expect(() => validateConfig(configDesc, tempDir)).not.toThrow()
    })

    it('应在排序值无效时抛出错误', () => {
      const config = { sort: 'invalid' as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/排序值无效/)
    })
  })

  describe('validateMarkdownIt', () => {
    it('应通过有效的 MarkdownIt 配置', () => {
      const config: UserConfig = {
        markdownIt: {
          options: {
            html: true,
            linkify: true
          },
          plugins: [],
          shikiConfig: {
            langs: ['javascript', 'typescript'],
            options: {
              themes: {
                dark: 'github-dark',
                light: 'github-light'
              }
            }
          }
        }
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在 markdownIt 类型无效时抛出错误', () => {
      const config = { markdownIt: 'invalid' as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/markdownIt 必须是对象类型/)
    })

    it('应在 markdownIt.options 类型无效时抛出错误', () => {
      const config = {
        markdownIt: {
          options: 'invalid'
        }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/markdownIt.options 必须是对象类型/)
    })

    it('应在 markdownIt.plugins 类型无效时抛出错误', () => {
      const config = {
        markdownIt: {
          plugins: 'invalid'
        }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/markdownIt.plugins 必须是数组类型/)
    })

    it('应在 markdownIt.shikiConfig 类型无效时抛出错误', () => {
      const config = {
        markdownIt: {
          shikiConfig: 'invalid'
        }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/markdownIt.shikiConfig 必须是对象类型/)
    })
  })
})
