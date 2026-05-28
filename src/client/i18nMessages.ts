import i18nMessages from 'virtual:vita-site/runtime/i18n-messages'
import type { I18nMessages } from './i18n.js'

export type { I18nMessages }

/**
 * 获取用户配置中的 i18n 翻译消息
 *
 * 返回由用户在服务端配置中通过 i18nMessages 字段提供的翻译消息。
 *
 * @returns i18n 翻译消息
 */
export function useI18nMessages(): Readonly<I18nMessages> {
  return i18nMessages
}
