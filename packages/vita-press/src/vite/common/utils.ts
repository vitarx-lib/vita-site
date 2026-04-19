import { readFileSync } from 'node:fs'
import { VitaPressApp } from '../../server/index.js'
import { VIRTUAL_CLIENT_ID } from './virtual.js'

/**
 * 加载客户端入口代码
 *
 * @param enterFile
 */
export function generateClientEnterCode(enterFile: string | null): string {
  let result = ''
  if (enterFile) {
    result = readFileSync(enterFile, 'utf-8')
  }
  if (!result) {
    result = `import { createApp } from "vitapress"\ncreateApp()`
  }
  return result
}

/**
 * 生成默认 index.html 模板
 *
 * @param app - VitaPressApp 实例
 * @returns HTML 模板字符串
 */
export function generateIndexHtml(app: VitaPressApp): string {
  const { title, description, keywords, lang } = app.config
  const headInject = app.config.injectHead?.join('\n') ?? ''
  const bodyInject = app.config.injectBody?.join('\n') ?? ''

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${keywords}" />
    <title>${title}</title>
    ${headInject}
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
import '${VIRTUAL_CLIENT_ID}'
    </script>
    ${bodyInject}
  </body>
</html>`
}
