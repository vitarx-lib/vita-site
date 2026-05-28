import { info, warn } from 'vitarx-router/file-router'
import { invalidateVirtualModule, setupWatcher, VIRTUAL_ROUTES_ID } from 'vitarx-router/vite'
import type { Plugin, ViteDevServer } from 'vite'
import { VitaSiteApp } from '../../server/index.js'
import { RESOLVED_CLIENT_CONFIG_ID, VIRTUAL_NAV_ID } from '../common/constant.js'
import { requestIndex } from '../middlewares/requestIndex.js'

/**
 * Dev plugin for VitaSite
 *
 * @param app - VitaSite app instance
 */
export function devPlugin(app: VitaSiteApp): Plugin {
  return {
    name: 'vite-plugin-vita-site-dev',
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
          // 2. 重新生成路由数据
          invalidateVirtualModule(server, VIRTUAL_ROUTES_ID)
          // 3. 重新生成导航数据
          invalidateVirtualModule(server, VIRTUAL_NAV_ID)
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
