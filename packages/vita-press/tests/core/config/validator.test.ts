import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { UserConfig } from '../../../src/core/types/config.js'
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

      const config: UserConfig = { docsDir: { dir: 'docs' } }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在文档目录不存在时抛出错误', () => {
      const config: UserConfig = { docsDir: { dir: 'non-existent-docs' } }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/目录不存在/)
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

  describe('validatePagesDir', () => {
    it('应通过有效的页面目录', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })

      const config: UserConfig = {
        pagesDir: { dir: 'pages' }
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应通过有效的页面目录（带完整配置）', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })

      const config: UserConfig = {
        pagesDir: {
          dir: 'pages',
          patterns: ['**/*.tsx'],
          group: '/'
        }
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在页面目录不存在时抛出错误', () => {
      const config: UserConfig = {
        pagesDir: { dir: 'non-existent-pages' }
      }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/目录不存在/)
    })

    it('应在 pagesDir.dir 为空时抛出错误', () => {
      const config = {
        pagesDir: { dir: '' }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/pagesDir.dir 必须是非空字符串/)
    })

    it('应在 pagesDir.patterns 类型无效时抛出错误', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })

      const config = {
        pagesDir: { dir: 'pages', patterns: 'invalid' }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/pagesDir.patterns 必须是数组类型/)
    })

    it('应在 pagesDir.group 类型无效时抛出错误', () => {
      const pagesDir = join(tempDir, 'pages')
      mkdirSync(pagesDir, { recursive: true })

      const config = {
        pagesDir: { dir: 'pages', group: 123 }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/pagesDir.group 必须是字符串类型/)
    })
  })

  describe('validateLang', () => {
    it('应通过有效的单语言配置', () => {
      const config: UserConfig = {
        lang: 'zh-CN'
      }

      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应通过有效的多语言配置', () => {
      const config: UserConfig = {
        lang: ['zh-CN', 'en-US']
      }

      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在 lang 类型无效时抛出错误', () => {
      const config = { lang: 123 as any }

      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/lang 必须是字符串或字符串数组类型/)
    })

    it('应在 lang 数组元素类型无效时抛出错误', () => {
      const config = { lang: ['zh-CN', 123] as any }

      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/lang\[1] 必须是字符串类型/)
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

    it('应通过有效的主题客户端数据', () => {
      const config: UserConfig = {
        theme: {
          clientData: {
            nav: ['home', 'about'],
            footer: { text: 'Copyright' }
          }
        }
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在主题客户端数据类型无效时抛出错误', () => {
      const config = {
        theme: {
          clientData: 'invalid'
        }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/theme.clientData 必须是对象类型/)
    })

    it('应在主题客户端数据不可序列化时抛出错误', () => {
      const circular: any = { name: 'test' }
      circular.self = circular

      const config = {
        theme: {
          clientData: circular
        }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/theme.clientData 必须是可序列化的对象/)
    })

    it('应通过有效的主题插件列表', () => {
      const config: UserConfig = {
        theme: {
          plugins: []
        }
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在主题插件列表类型无效时抛出错误', () => {
      const config = {
        theme: {
          plugins: 'invalid'
        }
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/theme.plugins 必须是数组类型/)
    })
  })

  describe('validateDts', () => {
    it('应通过有效的 dts 布尔值配置', () => {
      const configTrue: UserConfig = { dts: true }
      const configFalse: UserConfig = { dts: false }

      expect(() => validateConfig(configTrue, tempDir)).not.toThrow()
      expect(() => validateConfig(configFalse, tempDir)).not.toThrow()
    })

    it('应通过有效的 dts 字符串配置', () => {
      const config: UserConfig = { dts: 'typed-router.d.ts' }

      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在 dts 类型无效时抛出错误', () => {
      const config = { dts: 123 as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/dts 必须是布尔值或字符串类型/)
    })
  })

  describe('validateBase', () => {
    it('应通过有效的 base 配置', () => {
      const config: UserConfig = { base: '/' }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应通过有效的 base 子路径配置', () => {
      const config: UserConfig = { base: '/docs/' }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在 base 不以 / 开头时抛出错误', () => {
      const config = { base: 'docs/' as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/base 必须以 "\/" 开头/)
    })

    it('应在 base 不以 / 结尾时抛出错误', () => {
      const config = { base: '/docs' as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/base 必须以 "\/" 结尾/)
    })

    it('应在 base 类型无效时抛出错误', () => {
      const config = { base: 123 as any }
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/base 必须是字符串类型/)
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

  describe('validatePlugins', () => {
    it('应通过有效的根级别插件列表', () => {
      const config: UserConfig = {
        plugins: []
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应通过有效的根级别插件列表（包含插件对象）', () => {
      const config: UserConfig = {
        plugins: [
          { name: 'plugin1', version: '1.0.0' },
          { name: 'plugin2', description: 'Test plugin' }
        ]
      }
      expect(() => validateConfig(config, tempDir)).not.toThrow()
    })

    it('应在根级别插件列表类型无效时抛出错误', () => {
      const config = {
        plugins: 'invalid'
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/plugins.plugins 必须是数组类型/)
    })

    it('应在根级别插件元素类型无效时抛出错误', () => {
      const config = {
        plugins: ['invalid']
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/plugins.plugins\[0] 必须是对象类型/)
    })

    it('应在根级别插件元素为 null 时抛出错误', () => {
      const config = {
        plugins: [null]
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/plugins.plugins\[0] 必须是对象类型/)
    })

    it('应在根级别插件元素为数字时抛出错误', () => {
      const config = {
        plugins: [123]
      } as any
      expect(() => validateConfig(config, tempDir)).toThrow(ConfigValidationError)
      expect(() => validateConfig(config, tempDir)).toThrow(/plugins.plugins\[0] 必须是对象类型/)
    })
  })
})
