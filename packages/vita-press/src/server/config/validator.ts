import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PageDirOptions } from 'vitarx-router/file-router'
import type { UserConfig } from '../types/config.js'
import type { VitaPressPlugin } from '../types/index.js'

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
  validateLocales(config)
  validateMarkdownIt(config)
  validateDts(config)
  validatePlugins(config, 'plugins')
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
  if (!config.docDir) return

  validateDirConfig(config.docDir, 'docsDir', root)
}

/**
 * 验证页面目录配置
 *
 * @param config - 用户配置对象
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 页面目录配置无效时抛出
 */
function validatePagesDir(config: UserConfig, root: string): void {
  if (!config.pageDirs) return

  if (!Array.isArray(config.pageDirs)) {
    throw new ConfigValidationError(`pageDirs 必须是数组类型，当前类型: ${typeof config.pageDirs}`)
  }

  for (let i = 0; i < config.pageDirs.length; i++) {
    const pageDir = config.pageDirs[i]
    if (!pageDir) {
      throw new ConfigValidationError(`pageDirs[${i}] 不能为空`)
    }
    validateDirConfig(pageDir, `pageDirs[${i}]`, root)
  }
}

/**
 * 验证目录配置对象
 *
 * @param dirConfig - 目录配置
 * @param fieldName - 字段名称
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 目录配置无效时抛出
 */
function validateDirConfig(dirConfig: PageDirOptions, fieldName: string, root: string): void {
  if (typeof dirConfig !== 'object' || Array.isArray(dirConfig)) {
    throw new ConfigValidationError(`${fieldName} 必须是对象类型，当前类型: ${typeof dirConfig}`)
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

  if (dirConfig.include !== undefined) {
    if (!Array.isArray(dirConfig.include)) {
      throw new ConfigValidationError(
        `${fieldName}.patterns 必须是数组类型，当前类型: ${typeof dirConfig.include}`
      )
    }

    for (let i = 0; i < dirConfig.include.length; i++) {
      if (typeof dirConfig.include[i] !== 'string') {
        throw new ConfigValidationError(
          `${fieldName}.patterns[${i}] 必须是字符串类型，当前类型: ${typeof dirConfig.include[i]}`
        )
      }
    }
  }

  if (dirConfig.prefix !== undefined && typeof dirConfig.prefix !== 'string') {
    throw new ConfigValidationError(
      `${fieldName}.basePath 必须是字符串类型，当前类型: ${typeof dirConfig.prefix}`
    )
  }
}

/**
 * 验证语言配置
 *
 * @param config - 用户配置对象
 * @throws {ConfigValidationError} 语言配置无效时抛出
 */
function validateLocales(config: UserConfig): void {
  if (config.locales === undefined) return

  if (!Array.isArray(config.locales)) {
    throw new ConfigValidationError(`locales 必须是数组类型，当前类型: ${typeof config.locales}`)
  }

  for (let i = 0; i < config.locales.length; i++) {
    const locale = config.locales[i]
    if (!locale || typeof locale !== 'object') {
      throw new ConfigValidationError(`locales[${i}] 必须是对象类型，当前类型: ${typeof locale}`)
    }
    if (!locale.id) {
      throw new ConfigValidationError(`locales[${i}] 必须有 id 属性`)
    }
    if (!locale.name) {
      throw new ConfigValidationError(`locales[${i}] 必须有 name 属性`)
    }
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
    throw new ConfigValidationError(`dts 必须是布尔值或字符串类型，当前类型: ${typeof config.dts}`)
  }
}

/**
 * 验证插件配置
 * @param config
 * @param field
 */
function validatePlugins(config: { plugins?: VitaPressPlugin[] }, field: 'theme' | 'plugins') {
  if (config.plugins === undefined) return
  if (!Array.isArray(config.plugins)) {
    throw new ConfigValidationError(
      `${field}.plugins 必须是数组类型，当前类型: ${typeof config.plugins}`
    )
  }
  for (let i = 0; i < config.plugins.length; i++) {
    const plugin = config.plugins[i]
    if (!plugin || typeof plugin !== 'object') {
      throw new ConfigValidationError(
        `${field}.plugins[${i}] 必须是对象类型，当前类型: ${typeof plugin}`
      )
    }
    if (!plugin.name) {
      throw new ConfigValidationError(`${field}.plugins[${i}] 必须有 name 属性`)
    }
  }
}
