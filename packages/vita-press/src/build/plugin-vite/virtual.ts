import { existsSync, readFileSync } from 'node:fs'
import { warn } from 'vitarx-router/file-router'
import { RESOLVED_ROUTES_ID, VIRTUAL_ROUTES_ID } from 'vitarx-router/vite'
import type { Plugin } from 'vite'
import { VitaPressApp } from '../../server/index.js'
import {
  BODY_CONTENT_PLACEHOLDER,
  RESOLVED_CLIENT_CONFIG_ID,
  RESOLVED_I18N_MESSAGES_ID,
  RESOLVED_LOCALES_ID,
  RESOLVED_NAV_ID,
  RESOLVED_RUNTIME_ENTER_ID,
  RESOLVED_SITE_DATA_ID,
  VIRTUAL_CLIENT_CONFIG_ID,
  VIRTUAL_I18N_MESSAGES_ID,
  VIRTUAL_LOCALES_ID,
  VIRTUAL_NAV_ID,
  VIRTUAL_RUNTIME_ENTER_ID,
  VIRTUAL_SITE_DATA_ID
} from '../common/constant.js'
import {
  generateClientEnterCode,
  generateIndexHtml,
  generateServerEnterCode
} from '../common/generate.js'

/**
 * 收集插件中的客户端主题配置模块路径
 *
 * @param plugins - 已注册的插件列表
 * @returns clientConfig 模块路径数组
 */
export function collectClientConfigs(plugins: readonly { clientConfig?: string }[]): string[] {
  const configs: string[] = []
  for (const plugin of plugins) {
    if (plugin.clientConfig) {
      configs.push(plugin.clientConfig)
    }
  }
  return configs
}

/**
 * 收集并合并所有插件的 siteData
 *
 * 多个插件的 siteData 进行浅合并，后注册插件的同名属性覆盖先注册的。
 *
 * @param plugins - 已注册的插件列表
 * @returns 合并后的站点数据对象
 */
export function collectSiteData(
  plugins: readonly { siteData?: Record<string, unknown> }[]
): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const plugin of plugins) {
    if (plugin.siteData) {
      Object.assign(merged, plugin.siteData)
    }
  }
  return merged
}

/**
 * 生成客户端配置虚拟模块代码
 *
 * 策略：
 * - 收集所有插件的 clientConfig 模块路径并生成 import 语句
 * - 导入用户客户端配置文件
 * - 调用 resolveClientConfig 合并为最终配置并导出
 *
 * @param clientConfigPath - 用户客户端配置文件路径
 * @param clientConfigs - 插件提供的客户端配置模块路径数组
 * @returns 生成的模块代码
 */
export function generateClientConfigCode(
  clientConfigPath: string | null,
  clientConfigs: string[]
): string {
  const lines: string[] = []
  lines.push("import { resolveClientConfig } from 'vitapress'")

  for (let i = 0; i < clientConfigs.length; i++) {
    lines.push(`import __theme_${i} from '${clientConfigs[i]}'`)
  }

  const themeArray =
    clientConfigs.length > 0 ? `[${clientConfigs.map((_, i) => `__theme_${i}`).join(', ')}]` : '[]'

  if (clientConfigPath && existsSync(clientConfigPath)) {
    const content = readFileSync(clientConfigPath, 'utf-8')
    if (content.includes('export default')) {
      lines.push(`import __userConfig from '${clientConfigPath}'`)
      lines.push(`export default resolveClientConfig(${themeArray}, __userConfig)`)
    } else {
      lines.push(`export default resolveClientConfig(${themeArray}, {})`)
    }
  } else {
    lines.push(`export default resolveClientConfig(${themeArray}, {})`)
  }

  return lines.join('\n')
}

/**
 * Virtual module plugin for VitaPress
 * @param app
 */
export function virtualModulePlugin(app: VitaPressApp): Plugin {
  let isBuild = false
  return {
    name: 'vite-plugin-vitapress-virtual-module',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    resolveId(id: string): string | null {
      if (id === 'index.html') {
        return 'index.html'
      }
      if (id === VIRTUAL_RUNTIME_ENTER_ID) {
        return RESOLVED_RUNTIME_ENTER_ID
      }
      if (id === VIRTUAL_CLIENT_CONFIG_ID) {
        return RESOLVED_CLIENT_CONFIG_ID
      }
      if (id === VIRTUAL_LOCALES_ID) {
        return RESOLVED_LOCALES_ID
      }
      if (id === VIRTUAL_NAV_ID) {
        return RESOLVED_NAV_ID
      }
      if (id === VIRTUAL_SITE_DATA_ID) {
        return RESOLVED_SITE_DATA_ID
      }
      if (id === VIRTUAL_I18N_MESSAGES_ID) {
        return RESOLVED_I18N_MESSAGES_ID
      }
      if (id === VIRTUAL_ROUTES_ID) {
        return RESOLVED_ROUTES_ID
      }
      return null
    },
    load(id: string, options): string | null {
      if (id === 'index.html') {
        return generateIndexHtml(
          { ...app.config, lang: app.lang },
          isBuild ? BODY_CONTENT_PLACEHOLDER : ''
        )
      }
      if (id === RESOLVED_LOCALES_ID) {
        return `const locales = ${JSON.stringify(app.config.locales, null, 2)};\nexport default locales`
      }
      if (id === RESOLVED_NAV_ID) {
        const navTree = app.router.navTree ?? {}
        return `const navTree = ${JSON.stringify(navTree, null, 2)};\nexport default navTree`
      }
      if (id === RESOLVED_ROUTES_ID) {
        return app.router.generate().code
      }
      if (id === RESOLVED_RUNTIME_ENTER_ID) {
        if (options?.ssr) {
          return generateServerEnterCode()
        } else {
          return generateClientEnterCode()
        }
      }
      if (id === RESOLVED_CLIENT_CONFIG_ID) {
        const clientConfigs = collectClientConfigs(app.plugins)
        return generateClientConfigCode(app.clientConfigPath, clientConfigs)
      }
      if (id === RESOLVED_SITE_DATA_ID) {
        const siteData = collectSiteData(app.plugins)
        return `const siteData = ${JSON.stringify(siteData, null, 2)};\nexport default siteData`
      }
      if (id === RESOLVED_I18N_MESSAGES_ID) {
        const i18nMessages = app.config.i18nMessages
        return `const i18nMessages = ${JSON.stringify(i18nMessages, null, 2)};\nexport default i18nMessages`
      }
      return null
    },
    transform(code: string, id: string) {
      try {
        return app.router.removeDefinePage(code, id)
      } catch (error) {
        warn(`Failed to transform ${id}:`, error)
        return null
      }
    }
  }
}
