import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { DirConfig, ThemeConfig, UserConfig } from '../types/config.js'

/**
 * 配置验证错误
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigValidationError'
  }
}

/**
 * 验证配置对象
 *
 * @param config - 用户配置对象
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 配置验证失败时抛出
 */
export function validateConfig(config: UserConfig, root: string): void {
  validateBasicFields(config)
  validateInjectOptions(config)
  validateDocsDir(config, root)
  validatePagesDir(config, root)
  validateLang(config)
  validateTheme(config, root)
  validateMarkdownIt(config)
  validateDts(config)
  validateBase(config)
}

/**
 * 验证基础字段类型
 *
 * @param config - 用户配置对象
 * @throws {ConfigValidationError} 字段类型无效时抛出
 */
function validateBasicFields(config: UserConfig): void {
  if (config.title !== undefined && typeof config.title !== 'string') {
    throw new ConfigValidationError(`title 必须是字符串类型，当前类型: ${typeof config.title}`)
  }

  if (config.description !== undefined && typeof config.description !== 'string') {
    throw new ConfigValidationError(
      `description 必须是字符串类型，当前类型: ${typeof config.description}`
    )
  }

  if (config.keywords !== undefined && typeof config.keywords !== 'string') {
    throw new ConfigValidationError(
      `keywords 必须是字符串类型，当前类型: ${typeof config.keywords}`
    )
  }
}

/**
 * 验证注入选项
 *
 * @param config - 用户配置对象
 * @throws {ConfigValidationError} 注入选项无效时抛出
 */
function validateInjectOptions(config: UserConfig): void {
  validateStringArray(config.injectHead, 'injectHead')
  validateStringArray(config.injectBody, 'injectBody')
  validateStringArray(config.injectCode, 'injectCode')
}

/**
 * 验证字符串数组字段
 *
 * @param value - 字段值
 * @param fieldName - 字段名称
 * @throws {ConfigValidationError} 字段无效时抛出
 */
function validateStringArray(value: unknown, fieldName: string): void {
  if (value === undefined) return

  if (!Array.isArray(value)) {
    throw new ConfigValidationError(`${fieldName} 必须是数组类型，当前类型: ${typeof value}`)
  }

  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'string') {
      throw new ConfigValidationError(
        `${fieldName}[${i}] 必须是字符串类型，当前类型: ${typeof value[i]}`
      )
    }
  }
}

/**
 * 验证文档目录配置
 *
 * @param config - 用户配置对象
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 文档目录配置无效时抛出
 */
function validateDocsDir(config: UserConfig, root: string): void {
  if (!config.docsDir) return

  validateDirConfig(config.docsDir, 'docsDir', root)
}

/**
 * 验证页面目录配置
 *
 * @param config - 用户配置对象
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 页面目录配置无效时抛出
 */
function validatePagesDir(config: UserConfig, root: string): void {
  if (!config.pagesDir) return

  validateDirConfig(config.pagesDir, 'pagesDir', root)
}

/**
 * 验证目录配置对象
 *
 * @param dirConfig - 目录配置
 * @param fieldName - 字段名称
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 目录配置无效时抛出
 */
function validateDirConfig(dirConfig: DirConfig, fieldName: string, root: string): void {
  if (typeof dirConfig !== 'object' || Array.isArray(dirConfig)) {
    throw new ConfigValidationError(
      `${fieldName} 必须是对象类型，当前类型: ${typeof dirConfig}`
    )
  }

  if (!dirConfig.dir || typeof dirConfig.dir !== 'string') {
    throw new ConfigValidationError(`${fieldName}.dir 必须是非空字符串`)
  }

  const dirPath = resolve(root, dirConfig.dir)
  if (!existsSync(dirPath)) {
    throw new ConfigValidationError(
      `${fieldName} 目录不存在: ${dirConfig.dir} (解析路径: ${dirPath})`
    )
  }

  if (dirConfig.patterns !== undefined) {
    if (!Array.isArray(dirConfig.patterns)) {
      throw new ConfigValidationError(
        `${fieldName}.patterns 必须是数组类型，当前类型: ${typeof dirConfig.patterns}`
      )
    }

    for (let i = 0; i < dirConfig.patterns.length; i++) {
      if (typeof dirConfig.patterns[i] !== 'string') {
        throw new ConfigValidationError(
          `${fieldName}.patterns[${i}] 必须是字符串类型，当前类型: ${typeof dirConfig.patterns[i]}`
        )
      }
    }
  }

  if (dirConfig.group !== undefined && typeof dirConfig.group !== 'string') {
    throw new ConfigValidationError(
      `${fieldName}.group 必须是字符串类型，当前类型: ${typeof dirConfig.group}`
    )
  }
}

/**
 * 验证语言配置
 *
 * @param config - 用户配置对象
 * @throws {ConfigValidationError} 语言配置无效时抛出
 */
function validateLang(config: UserConfig): void {
  if (config.lang === undefined) return

  if (typeof config.lang === 'string') {
    return
  }

  if (Array.isArray(config.lang)) {
    for (let i = 0; i < config.lang.length; i++) {
      if (typeof config.lang[i] !== 'string') {
        throw new ConfigValidationError(
          `lang[${i}] 必须是字符串类型，当前类型: ${typeof config.lang[i]}`
        )
      }
    }
    return
  }

  throw new ConfigValidationError(
    `lang 必须是字符串或字符串数组类型，当前类型: ${typeof config.lang}`
  )
}

/**
 * 验证主题配置
 *
 * @param config - 用户配置对象
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 主题配置无效时抛出
 */
function validateTheme(config: UserConfig, root: string): void {
  if (!config.theme) return

  validateThemeEntry(config.theme, root)
  validateThemeLayout(config.theme, root)
  validateThemeHome(config.theme, root)
  validateThemeClientData(config.theme)
  validateThemePlugins(config.theme)
}

/**
 * 验证主题入口文件
 *
 * @param theme - 主题配置
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 入口文件不存在时抛出
 */
function validateThemeEntry(theme: ThemeConfig, root: string): void {
  if (!theme.entry) return

  const entryPath = resolve(root, theme.entry)
  if (!existsSync(entryPath)) {
    throw new ConfigValidationError(`主题入口文件不存在: ${theme.entry} (解析路径: ${entryPath})`)
  }
}

/**
 * 验证主题布局文件
 *
 * @param theme - 主题配置
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 布局文件不存在时抛出
 */
function validateThemeLayout(theme: ThemeConfig, root: string): void {
  if (!theme.layout) return

  const layoutPath = resolve(root, theme.layout)
  if (!existsSync(layoutPath)) {
    throw new ConfigValidationError(`主题布局文件不存在: ${theme.layout} (解析路径: ${layoutPath})`)
  }
}

/**
 * 验证主题首页文件
 *
 * @param theme - 主题配置
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 首页文件不存在时抛出
 */
function validateThemeHome(theme: ThemeConfig, root: string): void {
  if (!theme.home) return

  const homePath = resolve(root, theme.home)
  if (!existsSync(homePath)) {
    throw new ConfigValidationError(`主题首页文件不存在: ${theme.home} (解析路径: ${homePath})`)
  }
}

/**
 * 验证主题客户端数据
 *
 * @param theme - 主题配置
 * @throws {ConfigValidationError} 主题数据无效时抛出
 */
function validateThemeClientData(theme: ThemeConfig): void {
  if (theme.clientData === undefined) return

  if (typeof theme.clientData !== 'object' || Array.isArray(theme.clientData)) {
    throw new ConfigValidationError(
      `theme.clientData 必须是对象类型，当前类型: ${typeof theme.clientData}`
    )
  }

  try {
    JSON.stringify(theme.clientData)
  } catch (error) {
    throw new ConfigValidationError(
      `theme.clientData 必须是可序列化的对象，序列化失败: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * 验证主题插件列表
 *
 * @param theme - 主题配置
 * @throws {ConfigValidationError} 插件列表无效时抛出
 */
function validateThemePlugins(theme: ThemeConfig): void {
  if (theme.plugins === undefined) return

  if (!Array.isArray(theme.plugins)) {
    throw new ConfigValidationError(
      `theme.plugins 必须是数组类型，当前类型: ${typeof theme.plugins}`
    )
  }
}

/**
 * 验证 MarkdownIt 配置
 *
 * @param config - 用户配置对象
 * @throws {ConfigValidationError} MarkdownIt 配置无效时抛出
 */
function validateMarkdownIt(config: UserConfig): void {
  if (!config.markdownIt) return

  if (typeof config.markdownIt !== 'object' || Array.isArray(config.markdownIt)) {
    throw new ConfigValidationError(
      `markdownIt 必须是对象类型，当前类型: ${typeof config.markdownIt}`
    )
  }

  if (config.markdownIt.options !== undefined) {
    if (typeof config.markdownIt.options !== 'object' || Array.isArray(config.markdownIt.options)) {
      throw new ConfigValidationError(
        `markdownIt.options 必须是对象类型，当前类型: ${typeof config.markdownIt.options}`
      )
    }
  }

  if (config.markdownIt.plugins !== undefined) {
    if (!Array.isArray(config.markdownIt.plugins)) {
      throw new ConfigValidationError(
        `markdownIt.plugins 必须是数组类型，当前类型: ${typeof config.markdownIt.plugins}`
      )
    }
  }

  if (config.markdownIt.shikiConfig !== undefined) {
    if (
      typeof config.markdownIt.shikiConfig !== 'object' ||
      Array.isArray(config.markdownIt.shikiConfig)
    ) {
      throw new ConfigValidationError(
        `markdownIt.shikiConfig 必须是对象类型，当前类型: ${typeof config.markdownIt.shikiConfig}`
      )
    }
  }
}

/**
 * 验证 dts 配置
 *
 * @param config - 用户配置对象
 * @throws {ConfigValidationError} dts 配置无效时抛出
 */
function validateDts(config: UserConfig): void {
  if (config.dts === undefined) return

  if (typeof config.dts !== 'boolean' && typeof config.dts !== 'string') {
    throw new ConfigValidationError(
      `dts 必须是布尔值或字符串类型，当前类型: ${typeof config.dts}`
    )
  }
}

/**
 * 验证 base 配置
 *
 * @param config - 用户配置对象
 * @throws {ConfigValidationError} base 配置无效时抛出
 */
function validateBase(config: UserConfig): void {
  if (config.base === undefined) return

  if (typeof config.base !== 'string') {
    throw new ConfigValidationError(`base 必须是字符串类型，当前类型: ${typeof config.base}`)
  }

  if (!config.base.startsWith('/')) {
    throw new ConfigValidationError(`base 必须以 "/" 开头，当前值: ${config.base}`)
  }

  if (!config.base.endsWith('/')) {
    throw new ConfigValidationError(`base 必须以 "/" 结尾，当前值: ${config.base}`)
  }
}
