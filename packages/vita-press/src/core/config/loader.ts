import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadConfigFromFile } from 'vite'
import type { UserConfig } from '../types/config.js'
import { validateConfig } from './validator.js'

/**
 * 配置加载结果
 */
export interface LoadConfigResult {
  config: UserConfig
  configFile: string | undefined
}

/**
 * 支持的配置文件名称
 */
const CONFIG_FILES = [
  '.vitapress/config.ts',
  '.vitapress/config.js',
  '.vitapress/config.mjs',
  '.vitapress/config.mts'
]

/**
 * 加载配置
 *
 * @param root - 项目根目录
 * @param configFile - 指定的配置文件路径（可选）
 * @returns 加载后的配置结果
 */
export async function loadUserConfig(root: string, configFile?: string): Promise<LoadConfigResult> {
  const configFilePath = await findConfigFile(root, configFile)
  const userConfig = await readUserConfig(configFilePath)
  validateConfig(userConfig, process.cwd())
  return {
    config: userConfig,
    configFile: configFilePath
  }
}

/**
 * 查找配置文件
 *
 * @param root - 项目根目录
 * @param configFile - 指定的配置文件路径
 * @returns 配置文件路径，未找到时返回 undefined
 */
async function findConfigFile(root: string, configFile?: string): Promise<string | undefined> {
  if (configFile) {
    const absolutePath = resolve(root, configFile)
    if (!existsSync(absolutePath)) {
      throw new Error(`配置文件不存在: ${configFile}`)
    }
    return absolutePath
  }

  for (const fileName of CONFIG_FILES) {
    const filePath = resolve(root, fileName)
    if (existsSync(filePath)) {
      return filePath
    }
  }

  return undefined
}

/**
 * 加载用户配置文件
 *
 * @param configFile - 配置文件路径
 * @returns 用户配置对象
 */
async function readUserConfig(configFile?: string): Promise<UserConfig> {
  if (!configFile) return {}
  try {
    const result = await loadConfigFromFile(
      { command: 'serve', mode: 'development' },
      configFile,
      process.cwd(),
      'silent'
    )

    if (!result) {
      return {}
    }

    return (result.config as UserConfig) || {}
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`加载配置文件失败 in ${configFile}\n${message}`)
  }
}
