import vitarx from '@vitarx/plugin-vite'
import { setDebugEnabled } from 'vitarx-router/file-router'
import {
  build,
  createServer,
  mergeConfig,
  type Plugin,
  type PluginOption,
  preview,
  type UserConfig as ViteUserConfig
} from 'vite'
import { clientBuildPlugin } from '../../build/plugin-vite/clientBuild.js'
import { devPlugin } from '../../build/plugin-vite/dev.js'
import { serverBuildPlugin } from '../../build/plugin-vite/serverBuild.js'
import { virtualModulePlugin } from '../../build/plugin-vite/virtual.js'
import { type CommandName, VitaSiteApp } from '../../server/index.js'

export interface ServerOptions {
  /**
   * Port number
   */
  port?: string
  /**
   * Host address
   */
  host?: string
  /**
   * Open browser automatically
   */
  open?: boolean
  /**
   * Enable debug mode
   */
  debug?: boolean
  /**
   * Config file path
   */
  config?: string
  /**
   * Force build
   *
   * @default false
   */
  force?: boolean
}

/**
 * 创建 Vite 服务器配置
 * @param options - 服务器选项
 * @returns Vite 服务器配置对象
 */
function createServerConfig(options: ServerOptions): Exclude<ViteUserConfig['server'], undefined> {
  const serverConfig: ViteUserConfig['server'] = {}
  if (options.port) serverConfig.port = Number(options.port)
  if (options.host) serverConfig.host = options.host
  if (options.open) serverConfig.open = options.open
  return serverConfig
}

/**
 * 扁平化插件数组，处理嵌套数组和 Promise
 * @param plugins - 插件配置
 * @returns 扁平化后的插件数组
 */
async function flattenPlugins(plugins: PluginOption[] | undefined): Promise<Plugin[]> {
  if (!plugins) return []
  const result: Plugin[] = []
  for (const plugin of plugins) {
    if (!plugin) continue
    if (Array.isArray(plugin)) {
      result.push(...(await flattenPlugins(plugin)))
    } else if (plugin instanceof Promise) {
      const resolved = await plugin
      if (Array.isArray(resolved)) {
        result.push(...(await flattenPlugins(resolved)))
      } else if (resolved) {
        result.push(resolved)
      }
    } else {
      result.push(plugin)
    }
  }
  return result
}

/**
 * 检查插件列表中是否包含指定名称的插件
 * @param plugins - 插件配置
 * @param name - 插件名称
 * @returns 是否存在该插件
 */
async function hasPlugin(plugins: PluginOption[] | undefined, name: string): Promise<boolean> {
  const flatPlugins = await flattenPlugins(plugins)
  return flatPlugins.some(plugin => plugin && typeof plugin === 'object' && plugin.name === name)
}

/**
 * 获取 vitarx 插件配置
 * @param plugins - 现有插件列表
 * @returns vitarx 插件或 null（如果已存在）
 */
async function getVitarxPlugin(plugins: PluginOption[] | undefined): Promise<PluginOption> {
  const hasVitarxPlugin = await hasPlugin(plugins, 'vite-plugin-vitarx')
  return hasVitarxPlugin ? null : vitarx({ transformClassNameToClass: true })
}

/**
 * 处理预览服务器
 * @param app - VitaSite 应用实例
 * @param serverConfig - 服务器配置
 */
async function handlePreview(
  app: VitaSiteApp,
  serverConfig: Exclude<ViteUserConfig['server'], undefined>
): Promise<void> {
  const server = await preview(
    mergeConfig(app.config.vite, {
      server: serverConfig
    })
  )
  server.printUrls()
  server.bindCLIShortcuts({ print: true })
}

/**
 * 处理开发服务器
 * @param app - VitaSite 应用实例
 * @param serverConfig - 服务器配置
 */
async function handleDev(
  app: VitaSiteApp,
  serverConfig: Exclude<ViteUserConfig['server'], undefined>
): Promise<void> {
  const vitarxPlugin = await getVitarxPlugin(app.config.vite.plugins)
  const server = await createServer(
    mergeConfig(app.config.vite, {
      server: serverConfig,
      plugins: [virtualModulePlugin(app), devPlugin(app), vitarxPlugin]
    })
  )

  await server.listen()
  server.printUrls()
  server.bindCLIShortcuts({ print: true })
}

/**
 * 处理构建命令
 * @param app - VitaSite 应用实例
 * @param serverConfig - 服务器配置
 */
async function handleBuild(
  app: VitaSiteApp,
  serverConfig: Exclude<ViteUserConfig['server'], undefined>
): Promise<void> {
  const vitarxPlugin = await getVitarxPlugin(app.config.vite.plugins)

  await build(
    mergeConfig(app.config.vite, {
      server: serverConfig,
      plugins: [virtualModulePlugin(app), serverBuildPlugin(app), vitarxPlugin],
      logLevel: 'warn',
      build: {
        ssr: true
      }
    })
  )

  await build(
    mergeConfig(app.config.vite, {
      server: serverConfig,
      plugins: [virtualModulePlugin(app), clientBuildPlugin(app), vitarxPlugin]
    })
  )
}

/**
 * 创建服务器命令处理器
 * @param command - 命令名称
 * @returns 命令处理函数
 */
export function createServerCommandHandler(
  command: CommandName
): (options: ServerOptions) => Promise<void> {
  return async (options: ServerOptions): Promise<void> => {
    if (options.debug) setDebugEnabled(true)

    const app = await VitaSiteApp.create(process.cwd(), command, options.config)
    const serverConfig = createServerConfig(options)
    if (options.force) {
      app.mdParser.cache.clear()
    }
    switch (command) {
      case 'preview':
        await handlePreview(app, serverConfig)
        break
      case 'dev':
        await handleDev(app, serverConfig)
        break
      default:
        await handleBuild(app, serverConfig)
    }
  }
}
