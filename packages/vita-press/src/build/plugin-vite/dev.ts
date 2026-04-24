import { info, warn } from 'vitarx-router/file-router'
import { RESOLVED_ROUTES_ID, setupWatcher } from 'vitarx-router/vite'
import type { Plugin, ViteDevServer } from 'vite'
import { VitaPressApp } from '../../server/index.js'
import { RESOLVED_CLIENT_CONFIG_ID } from '../common/constant.js'
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
        if (app.clientConfigPath && file === app.clientConfigPath) {
          const clientMod = server.moduleGraph.getModuleById(RESOLVED_CLIENT_CONFIG_ID)
          if (clientMod) {
            server.moduleGraph.invalidateModule(clientMod)
          }
          info(`Invalidated runtime module for ${file} \nSending full reload to all clients`)
          server.ws.send({ type: 'full-reload' })
          return
        }
        try {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_ID)
          if (!mod) return

          const isRouteAffected = router.handleChange(event, file)
          if (isRouteAffected) {
            server.moduleGraph.invalidateModule(mod)
          }
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
