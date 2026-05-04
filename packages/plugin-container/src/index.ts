import containerModule from 'markdown-it-container'
import type { MarkdownItToken, VitaPressPlugin } from 'vitapress'

const ICONS = {
  info: `<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"></path>`,
  success: `<path d="M699 353h-46.9c-10.2 0-19.9 4.9-25.9 13.3L469 584.3l-71.2-98.8c-6-8.3-15.6-13.3-25.9-13.3H325c-6.5 0-10.3 7.4-6.5 12.7l124.6 172.8a31.8 31.8 0 0 0 51.7 0l210.6-292c3.9-5.3.1-12.7-6.4-12.7z"></path><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path>`,
  warning: `<path d="M464 720a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm16-304v184c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V416c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8zm475.7 440-416-720c-6.2-10.7-16.9-16-27.7-16s-21.6 5.3-27.7 16l-416 720C56 877.4 71.4 904 96 904h832c24.6 0 40-26.6 27.7-48zm-783.5-27.9L512 239.9l339.8 588.2H172.2z"></path>`,
  error: `<path d="M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm0 76c-205.4 0-372 166.6-372 372s166.6 372 372 372 372-166.6 372-372-166.6-372-372-372zm128.01 198.83c.03 0 .05.01.09.06l45.02 45.01a.2.2 0 0 1 .05.09.12.12 0 0 1 0 .07c0 .02-.01.04-.05.08L557.25 512l127.87 127.86a.27.27 0 0 1 .05.06v.02a.12.12 0 0 1 0 .07c0 .03-.01.05-.05.09l-45.02 45.02a.2.2 0 0 1-.09.05.12.12 0 0 1-.07 0c-.02 0-.04-.01-.08-.05L512 557.25 384.14 685.12c-.04.04-.06.05-.08.05a.12.12 0 0 1-.07 0c-.03 0-.05-.01-.09-.05l-45.02-45.02a.2.2 0 0 1-.05-.09.12.12 0 0 1 0-.07c0-.02.01-.04.06-.08L466.75 512 338.88 384.14a.27.27 0 0 1-.05-.06l-.01-.02a.12.12 0 0 1 0-.07c0-.03.01-.05.05-.09l45.02-45.02a.2.2 0 0 1 .09-.05.12.12 0 0 1 .07 0c.02 0 .04.01.08.06L512 466.75l127.86-127.86c.04-.05.06-.06.08-.06a.12.12 0 0 1 .07 0z"></path>`
} as const

/**
 * 创建 Markdown 容器插件，为 markdown-it 注册多种提示容器（info / success / warning / error）
 *
 * 容器语法：`::: type[:title]`，title 省略时默认使用类型大写形式。
 * 渲染输出包含对应图标（SVG）与标题的 `<div class="v-container">` 结构。
 *
 * @returns VitaPressPlugin - 可注入 VitaPress 的 markdown-it 容器插件实例
 */
export function containerPlugin(): VitaPressPlugin {
  return {
    name: 'vitapress-plugin-container',
    markdownIt(md) {
      for (const type of Object.keys(ICONS) as (keyof typeof ICONS)[]) {
        md.use(containerModule, type, {
          validate: (params: string) => {
            return params.trim().startsWith(type)
          },
          render: (tokens: MarkdownItToken[], idx: number) => {
            const token = tokens[idx]!
            if (token.nesting === 1) {
              // 开始标签
              const parts = token.info.trim().slice(type.length).trim().split(':')
              const title = parts[1] || type.toUpperCase()
              return `<div class="v-state-container ${type}"><div class="v-state-container-header"><svg width="18" height="18" viewBox="64 64 896 896" class="icon">${ICONS[type]}</svg><h4 class="title">${title}</h4></div>\n`
            } else {
              // 结束标签
              return '</div>\n'
            }
          }
        })
      }
    }
  }
}
