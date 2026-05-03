import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  collectClientConfigs,
  generateClientConfigCode
} from '../../src/build/plugin-vite/virtual.js'

const FIXTURES_DIR = join(import.meta.url.replace('file://', ''), '..', '..', 'fixtures', 'virtual')

describe('collectClientConfigs', () => {
  it('应从插件列表中收集 clientConfig 路径', () => {
    const plugins = [
      { name: 'plugin-a', clientConfig: 'theme-a/client' },
      { name: 'plugin-b' },
      { name: 'plugin-c', clientConfig: 'theme-c/client' }
    ]
    const result = collectClientConfigs(plugins)
    expect(result).toEqual(['theme-a/client', 'theme-c/client'])
  })

  it('无 clientConfig 时应返回空数组', () => {
    const result = collectClientConfigs([{}, {}])
    expect(result).toEqual([])
  })

  it('空插件列表应返回空数组', () => {
    const result = collectClientConfigs([])
    expect(result).toEqual([])
  })
})

describe('generateClientConfigCode', () => {
  it('无主题无用户配置时应生成仅 merge 空对象的代码', () => {
    const code = generateClientConfigCode(null, [])
    expect(code).toContain("import { resolveClientConfig } from 'vitapress'")
    expect(code).toContain('export default resolveClientConfig([], {})')
  })

  it('有主题时应生成 import 语句', () => {
    const code = generateClientConfigCode(null, ['my-theme/client', 'other-theme/client'])
    expect(code).toContain("import __theme_0 from 'my-theme/client'")
    expect(code).toContain("import __theme_1 from 'other-theme/client'")
    expect(code).toContain('export default resolveClientConfig([__theme_0, __theme_1], {})')
  })

  it('用户配置文件无默认导出时应使用空对象', () => {
    mkdirSync(FIXTURES_DIR, { recursive: true })
    const noDefaultPath = join(FIXTURES_DIR, 'no-default.ts')
    writeFileSync(noDefaultPath, 'export const foo = 1')
    try {
      const code = generateClientConfigCode(noDefaultPath, [])
      expect(code).not.toContain('import __userConfig')
      expect(code).toContain('export default resolveClientConfig([], {})')
    } finally {
      rmSync(FIXTURES_DIR, { recursive: true, force: true })
    }
  })

  it('用户配置文件有默认导出时应正常导入', () => {
    mkdirSync(FIXTURES_DIR, { recursive: true })
    const hasDefaultPath = join(FIXTURES_DIR, 'has-default.ts')
    writeFileSync(hasDefaultPath, 'export default { layout: null }')
    try {
      const code = generateClientConfigCode(hasDefaultPath, [])
      expect(code).toContain(`import __userConfig from '${hasDefaultPath}'`)
      expect(code).toContain('export default resolveClientConfig([], __userConfig)')
    } finally {
      rmSync(FIXTURES_DIR, { recursive: true, force: true })
    }
  })

  it('同时有主题和用户配置时应正确合并', () => {
    mkdirSync(FIXTURES_DIR, { recursive: true })
    const configPath = join(FIXTURES_DIR, 'config.ts')
    writeFileSync(configPath, 'export default {}')
    try {
      const code = generateClientConfigCode(configPath, ['my-theme/client'])
      expect(code).toContain("import __theme_0 from 'my-theme/client'")
      expect(code).toContain(`import __userConfig from '${configPath}'`)
      expect(code).toContain('export default resolveClientConfig([__theme_0], __userConfig)')
    } finally {
      rmSync(FIXTURES_DIR, { recursive: true, force: true })
    }
  })

  it('用户配置文件不存在时应使用空对象', () => {
    const code = generateClientConfigCode('/nonexistent/path.ts', [])
    expect(code).toContain('export default resolveClientConfig([], {})')
  })
})
