import MarkdownIt from 'markdown-it'
import type { MarkdownItConfig } from '../types/index.js'
import { anchorPoint } from './plugins/anchorPoint.js'
import { bracketTranslator } from './plugins/bracketTranslator.js'
import { fenceTranslator } from './plugins/fenceTranslator.js'
import { routerLink } from './plugins/routerLink.js'
import { createShikiHighlighter } from './plugins/shik.js'
import { tocTree } from './plugins/tocTree.js'

export async function createMarkdownIt({
  options,
  plugins,
  shikiConfig = {}
}: MarkdownItConfig = {}): Promise<MarkdownIt> {
  const md = new MarkdownIt(
    Object.assign({ html: true, linkify: true, typographer: true, xhtmlOut: true }, options)
  )
  // 创建shiki插件
  const shikiPlugin = await createShikiHighlighter(shikiConfig)
  const builtinPlugins = [
    shikiPlugin,
    tocTree,
    anchorPoint,
    routerLink,
    bracketTranslator,
    fenceTranslator
  ]
  // 挂载内置插件
  builtinPlugins.forEach(plugin => md.use(plugin))
  // 挂载用户自定义插件
  if (plugins && Array.isArray(plugins)) {
    for (const plugin of plugins) {
      if (typeof plugin === 'function') {
        md.use(plugin)
        continue
      }
      if ('options' in plugin) {
        if (Array.isArray(plugin.options)) {
          md.use(plugin.plugin, ...plugin.options)
        } else {
          md.use(plugin.plugin, plugin.options)
        }
      }
    }
  }
  return md
}
