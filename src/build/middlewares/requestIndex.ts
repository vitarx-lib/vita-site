import type { ServerResponse } from 'http'
import { type Connect, type ViteDevServer } from 'vite'
import { VitaPressApp } from '../../server/index.js'
import { generateIndexHtml } from '../common/generate.js'

/**
 * Handle request index.html
 *
 * @param server - Vite Dev Server
 * @param app - VitaPress App
 */
export function requestIndex(server: ViteDevServer, app: VitaPressApp): Connect.NextHandleFunction {
  return async (req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    const url = req.url ?? '/'
    const pathname = url.split('?')[0]
    const originalUrl = (req as { originalUrl?: string }).originalUrl ?? url

    if (pathname === '/' || pathname === '/index.html') {
      try {
        let html = generateIndexHtml({ ...app.config, lang: app.lang })
        html = await server.transformIndexHtml(url, html, originalUrl)
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(html)
        return
      } catch (error) {
        next(error)
        return
      }
    }
    next()
  }
}
