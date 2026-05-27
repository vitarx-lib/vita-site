import { describe, expect, it } from 'vitest'
import { useTheme } from '../../src/shared/theme.js'

describe('useTheme', () => {
  it('应返回 ThemeManager 实例', () => {
    const theme = useTheme()
    expect(theme).toBeDefined()
  })

  it('多次调用应返回同一实例（单例）', () => {
    const theme1 = useTheme()
    const theme2 = useTheme()
    expect(theme1).toBe(theme2)
  })

  it('应包含 mode 属性', () => {
    const theme = useTheme()
    expect(theme).toHaveProperty('mode')
  })

  it('应包含 bright 属性', () => {
    const theme = useTheme()
    expect(theme).toHaveProperty('bright')
  })

  it('应包含 setMode 方法', () => {
    const theme = useTheme()
    expect(typeof theme.setMode).toBe('function')
  })

  it('应包含 toggleBright 方法', () => {
    const theme = useTheme()
    expect(typeof theme.toggleBright).toBe('function')
  })
})
