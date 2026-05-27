import { createStaticTheme, type StaticThemeManager } from '@zmaui/color'
import { shallowRef } from 'vitarx'

export type ThemeManager = StaticThemeManager

// 创建主题实例
const theme: StaticThemeManager = createStaticTheme({
  defaultMode: 'dark',
  attribute: 'data-theme',
  refFactory: shallowRef,
  ssr: 'light',
  cacheKey: '__THEME_MODE__'
})
/**
 * 使用主题
 *
 * @returns {ThemeManager} - 主题管理器
 * @example
 * ```js
 * const theme = useTheme()
 * watch(() => theme.mode, (newMode,oldMode) => {
 *   console.log(`主题模式从：${oldMode} 切换到：${newMode}，当前亮度：${theme.bright}`)
 * })
 * console.log(theme.mode) // system
 * console.log(theme.bright) // dark
 * // 设置主题模式，支持 'light' | 'dark' | 'system'
 * theme.setMode('light') // 主题模式从：system 切换到：light，当前亮度：light
 *
 * // 切换亮度，注意：切换亮度后主题不会再随系统亮度变化，如需重新切换回跟随系统模式则需手动设置主题模式为 'system'
 * theme.toggleBright() // 主题模式从：light 切换到：dark，当前亮度：dark
 * ```
 */
export function useTheme(): ThemeManager {
  return theme
}
