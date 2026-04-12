import type { UserConfig } from '../types/config.js'

/**
 * 默认配置
 *
 * 定义 vita-press 的默认配置值，所有可选配置项都有合理的默认值
 */
export const DEFAULT_CONFIG: UserConfig = {
  title: '',
  description: '',
  keywords: '',
  docDir: 'docs',
  sort: 'asc',
  markdownIt: {
    options: {
      html: true,
      linkify: true,
      typographer: true,
      xhtmlOut: true
    }
  }
}
