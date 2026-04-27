import { existsSync, readFileSync } from 'node:fs'
import { warn } from 'vitarx-router/file-router'
import { RESOLVED_ROUTES_ID, VIRTUAL_ROUTES_ID } from 'vitarx-router/vite'
import type { Plugin } from 'vite'
import { VitaPressApp } from '../../server/index.js'
import {
  BODY_CONTENT_PLACEHOLDER,
  RESOLVED_CLIENT_CONFIG_ID,
  RESOLVED_LOCALES_ID,
  RESOLVED_RUNTIME_ENTER_ID,
  VIRTUAL_CLIENT_CONFIG_ID,
  VIRTUAL_LOCALES_ID,
  VIRTUAL_RUNTIME_ENTER_ID
} from '../common/constant.js'
import {
  generateClientEnterCode,
  generateIndexHtml,
  generateServerEnterCode
} from '../common/generate.js'

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
      if (id === VIRTUAL_ROUTES_ID) {
        return RESOLVED_ROUTES_ID
      }
      return null
    },
    load(id: string, options): string | null {
      // 生成index.html
      if (id === 'index.html') {
        return generateIndexHtml(
          { ...app.config, lang: app.lang },
          isBuild ? BODY_CONTENT_PLACEHOLDER : ''
        )
      }
      // 输出 locales 内容
      if (id === RESOLVED_LOCALES_ID) {
        return `const locales = ${JSON.stringify(app.config.locales, null, 2)};\nexport default locales`
      }
      // 输出routes内容
      if (id === RESOLVED_ROUTES_ID) {
        return app.router.generate().code
      }
      // 生成运行时入口代码
      if (id === RESOLVED_RUNTIME_ENTER_ID) {
        if (options?.ssr) {
          return generateServerEnterCode()
        } else {
          return generateClientEnterCode()
        }
      }
      // 加载客户端配置
      if (id === RESOLVED_CLIENT_CONFIG_ID) {
        if (app.clientConfigPath && existsSync(app.clientConfigPath)) {
          const code = readFileSync(app.clientConfigPath, 'utf-8')
          if (code.includes('export default')) {
            return code
          }
        }
        return 'export default {}'
      }
      return null
    },
    transform(code: string, id: string) {
      try {
        // 移除 definePage 全局宏
        return app.router.removeDefinePage(code, id)
      } catch (error) {
        warn(`Failed to transform ${id}:`, error)
        return null
      }
    }
  }
}
