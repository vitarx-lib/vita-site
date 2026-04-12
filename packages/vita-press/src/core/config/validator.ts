import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PageSource } from 'vitarx-router/file-router'
import type { Language, NavSort, ThemeConfig, UserConfig } from '../types/config.js'

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
  validateDocDir(config, root)
  validatePageDirs(config, root)
  validateSort(config)
  validateLanguages(config, root)
  validateTheme(config, root)
  validateMarkdownIt(config)
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
 * @throws {ConfigValidationError} 文档目录不存在时抛出
 */
function validateDocDir(config: UserConfig, root: string): void {
  if (!config.docDir) return

  const docDirPath = resolve(root, config.docDir)
  if (!existsSync(docDirPath)) {
    throw new ConfigValidationError(`文档目录不存在: ${config.docDir} (解析路径: ${docDirPath})`)
  }
}

/**
 * 验证页面目录配置
 *
 * @param config - 用户配置对象
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 页面目录配置无效时抛出
 */
function validatePageDirs(config: UserConfig, root: string): void {
  if (!config.pageDirs || config.pageDirs.length === 0) return

  for (let i = 0; i < config.pageDirs.length; i++) {
    const pageDir = config.pageDirs[i]
    if (!pageDir) continue

    validatePageSource(pageDir, i, root)
  }
}

/**
 * 验证单个页面目录配置
 *
 * @param pageSource - 页面目录配置
 * @param index - 配置索引
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 页面目录配置无效时抛出
 */
function validatePageSource(pageSource: PageSource, index: number, root: string): void {
  if (typeof pageSource === 'string') {
    const dirPath = resolve(root, pageSource)
    if (!existsSync(dirPath)) {
      throw new ConfigValidationError(
        `页面目录不存在: ${pageSource} (pageDirs[${index}], 解析路径: ${dirPath})`
      )
    }
    return
  }

  if (typeof pageSource === 'object') {
    if (!pageSource.dir) {
      throw new ConfigValidationError(`pageDirs[${index}].dir 不能为空`)
    }

    const dirPath = resolve(root, pageSource.dir)
    if (!existsSync(dirPath)) {
      throw new ConfigValidationError(
        `页面目录不存在: ${pageSource.dir} (pageDirs[${index}], 解析路径: ${dirPath})`
      )
    }

    if (pageSource.prefix !== undefined && typeof pageSource.prefix !== 'string') {
      throw new ConfigValidationError(
        `pageDirs[${index}].prefix 必须是字符串类型，当前类型: ${typeof pageSource.prefix}`
      )
    }

    if (pageSource.include !== undefined && !Array.isArray(pageSource.include)) {
      throw new ConfigValidationError(
        `pageDirs[${index}].include 必须是数组类型，当前类型: ${typeof pageSource.include}`
      )
    }

    if (pageSource.exclude !== undefined && !Array.isArray(pageSource.exclude)) {
      throw new ConfigValidationError(
        `pageDirs[${index}].exclude 必须是数组类型，当前类型: ${typeof pageSource.exclude}`
      )
    }

    if (pageSource.group !== undefined && typeof pageSource.group !== 'boolean') {
      throw new ConfigValidationError(
        `pageDirs[${index}].group 必须是布尔类型，当前类型: ${typeof pageSource.group}`
      )
    }
  }
}

/**
 * 验证多语言配置
 *
 * @param config - 用户配置对象
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 语言配置无效时抛出
 */
function validateLanguages(config: UserConfig, root: string): void {
  if (!config.languages || config.languages.length === 0) return

  validateLanguageFields(config.languages)
  validateLanguageIds(config.languages)
  validateLanguageDirectories(config, root)
}

/**
 * 验证语言 ID 是否重复
 *
 * @param languages - 语言配置数组
 * @throws {ConfigValidationError} 存在重复 ID 时抛出
 */
function validateLanguageIds(languages: Language[]): void {
  const ids = languages.map(lang => lang.id)
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)

  if (duplicates.length > 0) {
    throw new ConfigValidationError(`语言 ID 重复: ${duplicates.join(', ')}`)
  }
}

/**
 * 验证语言目录是否存在
 *
 * @param config - 用户配置对象
 * @param root - 项目根目录
 * @throws {ConfigValidationError} 语言目录不存在时抛出
 */
function validateLanguageDirectories(config: UserConfig, root: string): void {
  if (!config.docDir || !config.languages) return

  const missingDirs: string[] = []

  for (const lang of config.languages) {
    const langDir = resolve(root, config.docDir, lang.id)
    if (!existsSync(langDir)) {
      missingDirs.push(lang.id)
    }
  }

  if (missingDirs.length > 0) {
    throw new ConfigValidationError(
      `语言目录不存在: ${missingDirs.join(', ')} (应在 ${config.docDir} 目录下)`
    )
  }
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
  validateThemeInjectOptions(config.theme)
  validateThemeData(config.theme)
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
 * 验证主题注入选项
 *
 * @param theme - 主题配置
 * @throws {ConfigValidationError} 注入选项无效时抛出
 */
function validateThemeInjectOptions(theme: ThemeConfig): void {
  validateStringArray(theme.injectHead, 'theme.injectHead')
  validateStringArray(theme.injectBody, 'theme.injectBody')
  validateStringArray(theme.injectCode, 'theme.injectCode')
}

/**
 * 验证主题数据
 *
 * @param theme - 主题配置
 * @throws {ConfigValidationError} 主题数据无效时抛出
 */
function validateThemeData(theme: ThemeConfig): void {
  if (theme.data === undefined) return

  if (typeof theme.data !== 'object' || Array.isArray(theme.data)) {
    throw new ConfigValidationError(`theme.data 必须是对象类型，当前类型: ${typeof theme.data}`)
  }

  try {
    JSON.stringify(theme.data)
  } catch (error) {
    throw new ConfigValidationError(
      `theme.data 必须是可序列化的对象，序列化失败: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * 验证排序配置
 *
 * @param config - 用户配置对象
 * @throws {ConfigValidationError} 排序值无效时抛出
 */
function validateSort(config: UserConfig): void {
  if (!config.sort) return

  const validSortValues: NavSort[] = ['asc', 'desc']
  if (!validSortValues.includes(config.sort)) {
    throw new ConfigValidationError(
      `排序值无效: ${config.sort} (有效值: ${validSortValues.join(', ')})`
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
 * 验证语言配置字段
 *
 * @param languages - 语言配置数组
 * @throws {ConfigValidationError} 语言字段无效时抛出
 */
function validateLanguageFields(languages: Language[]): void {
  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i]
    if (!lang) continue

    if (!lang.id || typeof lang.id !== 'string') {
      throw new ConfigValidationError(`languages[${i}].id 必须是非空字符串`)
    }

    if (!lang.name || typeof lang.name !== 'string') {
      throw new ConfigValidationError(`languages[${i}].name 必须是非空字符串`)
    }
  }
}
