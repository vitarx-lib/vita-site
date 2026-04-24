import { readFileSync } from 'node:fs'
import path from 'node:path'
import { type Plugin, type UserConfig, version } from 'vite'
import { writeCacheFileSync } from '../../server/common/utils.js'
import { VitaPressApp } from '../../server/index.js'
import { BODY_CONTENT_PLACEHOLDER } from '../common/constant.js'
import { HtmlPatcher } from '../common/htmlPatcher.js'

interface ServerRenderModule {
  renderPages: () => Promise<{
    [url: string]: { body: string; context: { [key: string]: any }; meta: { [key: string]: any } }
  }>
}
/**
 * Client build plugin
 * @param app
 */
export function clientBuildPlugin(app: VitaPressApp): Plugin {
  let distDir = ''
  return {
    name: 'vite-plugin-vita-press-client-build',
    config(): UserConfig {
      return {
        build: {
          [version.startsWith('8') ? 'rolldownOptions' : 'rollupOptions']: {
            input: 'index.html'
          }
        }
      }
    },
    configResolved(config) {
      distDir = path.resolve(app.root, config.build.outDir)
    },
    async closeBundle() {
      const htmlTemplate = readFileSync(path.resolve(distDir, 'index.html'), 'utf-8')

      const { renderPages } = (await import(
        path.resolve(app.tempDir, 'server-render.js')
      )) as ServerRenderModule

      const pages = await renderPages()

      for (const [url, detail] of Object.entries(pages)) {
        const context = detail.context || {}
        const meta = detail.meta

        const title = meta['title'] || app.config.title
        const description = meta['description'] || app.config.description
        const keywords = meta['keywords'] || app.config.keywords
        const lang = meta['lang'] || app.config.lang

        // SSR HTML
        const ssrHtml = detail.body || ''

        const patch = new HtmlPatcher(htmlTemplate)
        patch
          .setLang(lang)
          .setTitle(title)
          .setMeta('description', description)
          .setMeta('keywords', keywords)
          .replace(BODY_CONTENT_PLACEHOLDER, ssrHtml).injectScript(`
    window.__INITIAL_STATE__ = ${JSON.stringify(context)}
  `)

        const html = patch.get()

        // 4️⃣ 输出路径
        const filePath = path.resolve(distDir, `${url === '/' ? 'index' : url.slice(1)}.html`)

        writeCacheFileSync(filePath, html)
      }
    }
  }
}
