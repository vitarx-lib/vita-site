import MarkdownIt from 'markdown-it'
import type { MarkdownItConfig } from '../../types/index.js'
import { anchorPoint } from '../plugins/anchorPoint.js'
import { bracketTranslator } from '../plugins/bracketTranslator.js'
import { fenceTranslator } from '../plugins/fenceTranslator.js'
import { jsxComponentParser } from '../plugins/jsxComponentParser.js'
import { routerLink } from '../plugins/routerLink.js'
import { createShikiHighlighter } from '../plugins/shik.js'
import { tocTree } from '../plugins/tocTree.js'

/**
 * 创建并配置一个 MarkdownIt 实例
 *
 * @param {MarkdownItConfig} [config={}] - 配置对象，包含以下属性：
 *   - options: MarkdownIt 的基础配置选项
 *   - plugins: 用户自定义插件数组
 *   - shikiConfig: Shiki 代码高亮配置
 * @returns {Promise<MarkdownIt>} 返回配置好的 MarkdownIt 实例
 */
export async function createMarkdownIt(config: MarkdownItConfig = {}): Promise<MarkdownIt> {
  const { options, plugins, shikiConfig = {} } = config
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
    fenceTranslator,
    jsxComponentParser
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
