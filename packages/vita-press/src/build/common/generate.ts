import { type ResolvedConfig, type SiteOptions } from '../../server/index.js'
import { VIRTUAL_RUNTIME_ENTER_ID } from './constant.js'

/**
 * 生成客户端入口代码
 */
export function generateClientEnterCode(): string {
  return `import { createApp } from "vitapress"\n\ncreateApp()`
}

/**
 * 生成服务器入口代码
 *
 * @returns {string} 服务器入口代码
 */
export function generateServerEnterCode(): string {
  return `import { createApp } from "vitapress"
import { renderToString } from "vitarx"
import { __ROUTER_KEY__ } from "vitarx-router"
/**
 * 渲染所有静态页面为字符串
 *
 * @returns {Promise<{ [url: string]: { body: string; context: { [key: string]: any }; meta: { [key: string]: any } } }>}
 */
export async function renderPages() {
  const app = await createApp()
  const router = app.inject(__ROUTER_KEY__)
  const pages = {}
  for (const [url, route] of router.manager.staticRoutes) {
    await router.replace({ index: url })
    await router.resolveComponents()
    const context = {}
    const body = await renderToString(app, context)
    pages[url] = {
      body,
      context,
      meta: router.route.meta || {}
    }
  }
  return pages
}
`
}

/**
 * 生成入口 HTML
 *
 * @param config - 站点配置
 * @param content - HTML 内容
 * @returns HTML 模板字符串
 */
export function generateIndexHtml(
  config: Pick<ResolvedConfig, keyof SiteOptions | 'injectBody' | 'injectHead'> & { lang: string },
  content: string = ''
): string {
  const { title, description, keywords, injectHead, injectBody, lang } = config
  const headInject = injectHead.join('\n')
  const bodyInject = injectBody.join('\n')

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${keywords}" />
    <title>${title}</title>${headInject ? `\n${headInject}` : ''}
  </head>
  <body>
    <div id="root">${content}</div>
    <script type="module">
      import "${VIRTUAL_RUNTIME_ENTER_ID}"
    </script>${bodyInject ? `\n${bodyInject}` : ''}
  </body>
</html>`
}
