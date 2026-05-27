import { type App } from 'vitarx'
import type { LangSelectorProps } from '../components/LangSelector.js'

export const langSelectorSymbol = Symbol.for('vitapress:langSelector')

/**
 * 设置语言选择器
 *
 * @param app - 应用实例
 * @param props - 语言选择器属性
 *
 * @example
 * ```js
 * import { defineConfig } from 'vitapress'
 * import { setLangSelector } from '@vitapress/theme-default'
 *
 * export default defineConfig({
 *   enhanceApp(app, { i18n }) {
 *     // 多语言分别部署时，通过设置 locales 和 activeId、onSelect 实现多语言跳转
 *     const locales = [
 *       { name: 'English', id: 'https://en.example.com/' },
 *       { name: 'Chinese', id: 'https://zh.example.com/' }
 *     ]
 *     setLangSelector(app, {
 *       locales,
 *       // 必须使用 getter，否则会丢失响应性
 *       get activeId(){
 *         // 根据 i18n.lang.value 获取当前语言，返回对应的 id
 *         if(i18n.lang.value === 'en'){
 *           return locales[0].id
 *         }
 *         return locales[1].id
 *       },
 *       onSelect(id){
 *         // 打开新窗口跳转
 *         window.open(id, '_blank')
 *       }
 *     })
 *   }
 * })
 * ```
 */
export function setLangSelector(app: App, props: LangSelectorProps): void {
  app.provide(langSelectorSymbol, props)
}
