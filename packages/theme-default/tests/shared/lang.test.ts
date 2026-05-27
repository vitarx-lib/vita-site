import { describe, expect, it, vi } from 'vitest'
import { langSelectorSymbol, setLangSelector } from '../../src/shared/lang.js'

describe('langSelectorSymbol', () => {
  it('应为全局共享的 Symbol', () => {
    const expected = Symbol.for('vitapress:langSelector')
    expect(langSelectorSymbol).toBe(expected)
  })
})

describe('setLangSelector', () => {
  it('应调用 app.provide 并传入 langSelectorSymbol 和 props', () => {
    const provideMock = vi.fn()
    const app = { provide: provideMock } as any
    const props = {
      locales: [
        { name: 'English', id: 'en' },
        { name: 'Chinese', id: 'zh' }
      ],
      onSelect: vi.fn()
    }

    setLangSelector(app, props)

    expect(provideMock).toHaveBeenCalledOnce()
    expect(provideMock).toHaveBeenCalledWith(langSelectorSymbol, props)
  })

  it('应支持包含 activeId 的 props', () => {
    const provideMock = vi.fn()
    const app = { provide: provideMock } as any
    const props = {
      locales: [{ name: 'English', id: 'en' }],
      activeId: 'en',
      onSelect: vi.fn()
    }

    setLangSelector(app, props)

    expect(provideMock).toHaveBeenCalledWith(langSelectorSymbol, props)
  })

  it('应支持 getter 形式的 activeId', () => {
    const provideMock = vi.fn()
    const app = { provide: provideMock } as any
    let currentLang = 'en'
    const props = {
      locales: [
        { name: 'English', id: 'en' },
        { name: 'Chinese', id: 'zh' }
      ],
      get activeId() {
        return currentLang
      },
      onSelect: vi.fn()
    }

    setLangSelector(app, props)

    const providedProps = provideMock.mock.calls[0]![1]
    expect(providedProps.activeId).toBe('en')

    currentLang = 'zh'
    expect(providedProps.activeId).toBe('zh')
  })
})
