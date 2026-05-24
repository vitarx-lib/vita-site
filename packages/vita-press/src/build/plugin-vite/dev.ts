import { info, warn } from 'vitarx-router/file-router'
import { RESOLVED_ROUTES_ID, setupWatcher } from 'vitarx-router/vite'
import type { Plugin, ViteDevServer } from 'vite'
import { VitaPressApp } from '../../server/index.js'
import { RESOLVED_CLIENT_CONFIG_ID, RESOLVED_NAV_ID } from '../common/constant.js'
import { requestIndex } from '../middlewares/requestIndex.js'

/**
 * Dev plugin for VitaPress
 *
 * @param app - VitaPress app instance
 */
export function devPlugin(app: VitaPressApp): Plugin {
  return {
    name: 'vite-plugin-vita-press-dev',
    configureServer(server: ViteDevServer) {
      const router = app.router
      if (app.clientConfigPath) {
        server.watcher.add(app.clientConfigPath)
      }

      setupWatcher(router, server, (event, file) => {
        // 客户端配置文件变化时，重启客户端
        if (app.clientConfigPath && file === app.clientConfigPath) {
          const clientMod = server.moduleGraph.getModuleById(RESOLVED_CLIENT_CONFIG_ID)
          if (clientMod) {
            server.moduleGraph.invalidateModule(clientMod)
          }
          info(`Invalidated runtime module for ${file} \nSending full reload to all clients`)
          server.ws.send({ type: 'full-reload' })
          return
        }
        // 路由文件变化时，重新生成路由数据
        try {
          // 1. 处理路由文件变化
          if (!router.handleChange(event, file)) return
          // 2. 查询路由模块
          const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_ID)
          if (!mod || !mod.importers.size) return
          // 3. 通知客户端路由数据变化
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'custom', event: 'vitarx-router:routes-change' })
          // 4. 查询导航模块
          const nav = server.moduleGraph.getModuleById(RESOLVED_NAV_ID)
          if (!nav || !nav.importers.size) return
          // 5. 通知客户端导航数据变化
          server.moduleGraph.invalidateModule(nav)
          server.ws.send({ type: 'custom', event: 'vitapress:nav-change' })
        } catch (error) {
          warn(`Failed to handle file change for ${file}:`, error)
        }
      })
      return () => {
        server.middlewares.use(requestIndex(server, app))
      }
    }
  }
}
