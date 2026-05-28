import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __I18N_INJECT_KEY__, I18n, useI18n } from '../../src/client/i18n.js'

const { mockGetApp } = vi.hoisted(() => ({
  mockGetApp: vi.fn()
}))

/**
 * 模拟 vitarx computed 实现
 *
 * 每次访问 .value 时重新执行计算函数，并传递上一次的计算结果作为 prev 参数，
 * 模拟 vitarx 中 computed 的核心行为
 */
function mockComputed<T>(fn: (prev?: T) => T): { value: T } {
  let prev: T | undefined
  return {
    get value(): T {
      const result = fn(prev)
      prev = result
      return result
    }
  }
}

vi.mock('virtual:vitapress/runtime/locales', () => ({
  default: [
    { id: 'zh-CN', name: '中文' },
    { id: 'en', name: 'English' },
    { id: 'ja', name: '日本語' }
  ]
}))

vi.mock('virtual:vitapress/runtime/i18n-messages', () => ({
  default: {
    'zh-CN': {
      welcome: '欢迎',
      greeting: '你好，{name}！',
      farewell: '再见，{name}，{wish}！',
      fallback_only: '仅中文'
    },
    en: {
      welcome: 'Welcome',
      greeting: 'Hello, {name}!',
      farewell: 'Goodbye, {name}, {wish}!'
    },
    ja: {
      welcome: 'ようこそ'
    }
  }
}))

vi.mock('vitarx', () => ({
  computed: mockComputed,
  getApp: mockGetApp
}))

/**
 * 创建模拟 Router 实例
 *
 * @param options - 路由初始状态
 * @returns 模拟的 Router 对象
 */
function createMockRouter(options?: {
  path?: string
  meta?: Record<string, any>
  matched?: Array<{ path: string; parent?: { path: string } }>
}) {
  return {
    route: {
      path: options?.path ?? '/',
      meta: { lang: '', ...options?.meta },
      matched: options?.matched ?? []
    },
    push: vi.fn()
  }
}

describe('I18n', () => {
  let router: ReturnType<typeof createMockRouter>

  beforeEach(() => {
    router = createMockRouter()
  })

  describe('构造函数', () => {
    it('应正确初始化 defaultLang 为第一个语言', () => {
      const i18n = new I18n(router as any)
      expect(i18n.defaultLang).toBe('zh-CN')
    })

    it('应正确初始化 langs 列表', () => {
      const i18n = new I18n(router as any)
      expect(i18n.langs).toEqual(['zh-CN', 'en', 'ja'])
    })

    it('当路由 meta.lang 存在时，lang 应返回对应语言', () => {
      router.route.meta.lang = 'en'
      const i18n = new I18n(router as any)
      expect(i18n.lang.value).toBe('en')
    })

    it('当路由 meta.lang 不存在时，lang 应回退到 defaultLang', () => {
      const i18n = new I18n(router as any)
      expect(i18n.lang.value).toBe('zh-CN')
    })

    it('locale 应返回当前语言对应的 PageLocale', () => {
      router.route.meta.lang = 'en'
      const i18n = new I18n(router as any)
      const locale = i18n.locale.value!
      expect(locale.id).toBe('en')
      expect(locale.name).toBe('English')
      expect(locale.path).toBeDefined()
    })

    it('当当前语言无匹配 locale 时，locale 应返回 undefined', () => {
      router.route.meta.lang = 'nonexistent'
      const i18n = new I18n(router as any)
      expect(i18n.locale.value).toBeUndefined()
    })
  })

  describe('t()', () => {
    it('应返回当前语言的翻译文本', () => {
      const i18n = new I18n(router as any)
      expect(i18n.t('welcome')).toBe('欢迎')
    })

    it('应返回非默认语言的翻译文本', () => {
      router.route.meta.lang = 'en'
      const i18n = new I18n(router as any)
      expect(i18n.t('welcome')).toBe('Welcome')
    })

    it('应支持单参数插值', () => {
      const i18n = new I18n(router as any)
      expect(i18n.t('greeting', { name: '世界' })).toBe('你好，世界！')
    })

    it('应支持多参数插值', () => {
      const i18n = new I18n(router as any)
      expect(i18n.t('farewell', { name: '世界', wish: '祝你好运' })).toBe('再见，世界，祝你好运！')
    })

    it('插值参数为数字时应正确转换', () => {
      const i18n = new I18n(router as any)
      expect(i18n.t('greeting', { name: 42 })).toBe('你好，42！')
    })

    it('当翻译键不存在时，应回退到默认语言的翻译', () => {
      router.route.meta.lang = 'en'
      const i18n = new I18n(router as any)
      expect(i18n.t('fallback_only')).toBe('仅中文')
    })

    it('当翻译键在默认语言中也不存在时，应回退到键名本身', () => {
      const i18n = new I18n(router as any)
      expect(i18n.t('nonexistent_key')).toBe('nonexistent_key')
    })

    it('当第二个参数为字符串时，应作为默认回退值', () => {
      const i18n = new I18n(router as any)
      expect(i18n.t('nonexistent_key', '默认文本')).toBe('默认文本')
    })

    it('第二个参数字符串回退优先级高于第三个参数', () => {
      const i18n = new I18n(router as any)
      expect(i18n.t('nonexistent_key', '优先回退', '次要回退')).toBe('优先回退')
    })

    it('当第二个参数为对象时，应使用第三个参数作为默认回退值', () => {
      const i18n = new I18n(router as any)
      expect(i18n.t('nonexistent_key', { name: 'test' }, '对象参数时的回退')).toBe(
        '对象参数时的回退'
      )
    })

    it('当当前语言无翻译消息时，应回退到默认语言', () => {
      router.route.meta.lang = 'ja'
      const i18n = new I18n(router as any)
      expect(i18n.t('greeting')).toBe('你好，{name}！')
    })
  })

  describe('setLang()', () => {
    it('应调用 router.push 跳转到目标语言的路径', () => {
      const i18n = new I18n(router as any)
      i18n.setLang('en')
      expect(router.push).toHaveBeenCalledWith('/index-en')
    })

    it('切换到默认语言时应跳转到无后缀路径', () => {
      router.route.path = '/guide-en'
      router.route.meta.lang = 'en'
      const i18n = new I18n(router as any)
      i18n.setLang('zh-CN')
      expect(router.push).toHaveBeenCalledWith('/guide')
    })

    it('当语言标识无效时应抛出错误', () => {
      const i18n = new I18n(router as any)
      expect(() => i18n.setLang('invalid')).toThrow('[i18n] Invalid language: invalid')
    })
  })

  describe('has()', () => {
    it('支持的语言应返回 true', () => {
      const i18n = new I18n(router as any)
      expect(i18n.has('zh-CN')).toBe(true)
      expect(i18n.has('en')).toBe(true)
      expect(i18n.has('ja')).toBe(true)
    })

    it('不支持的语言应返回 false', () => {
      const i18n = new I18n(router as any)
      expect(i18n.has('fr')).toBe(false)
    })
  })

  describe('buildPath()', () => {
    it('默认语言应返回无后缀路径', () => {
      const i18n = new I18n(router as any)
      expect(i18n.buildPath('/guide' as any)).toBe('/guide')
    })

    it('非默认语言应添加语言后缀', () => {
      const i18n = new I18n(router as any)
      expect(i18n.buildPath('/guide' as any, 'en')).toBe('/guide-en')
    })

    it('根路径非默认语言应返回 /index-{lang}', () => {
      const i18n = new I18n(router as any)
      expect(i18n.buildPath('/' as any, 'en')).toBe('/index-en')
    })

    it('默认语言路径以 /index 结尾时应移除 /index 后缀', () => {
      const i18n = new I18n(router as any)
      expect(i18n.buildPath('/guide/index' as any)).toBe('/guide')
    })

    it('默认语言路径为 /index 时应返回 /', () => {
      const i18n = new I18n(router as any)
      expect(i18n.buildPath('/index' as any)).toBe('/')
    })

    it('不指定语言时应使用当前语言', () => {
      router.route.meta.lang = 'en'
      const i18n = new I18n(router as any)
      expect(i18n.buildPath('/guide' as any)).toBe('/guide-en')
    })
  })

  describe('parsePathLang()', () => {
    it('应从路径中解析语言标识', () => {
      const i18n = new I18n(router as any)
      expect(i18n.parsePathLang('/guide-en')).toBe('en')
    })

    it('应从路径中解析多段式语言标识', () => {
      const i18n = new I18n(router as any)
      expect(i18n.parsePathLang('/guide-zh-CN')).toBe('zh-CN')
    })

    it('路径无语言后缀时应返回默认语言', () => {
      const i18n = new I18n(router as any)
      expect(i18n.parsePathLang('/guide')).toBe('zh-CN')
    })

    it('应正确处理带文件扩展名的路径', () => {
      const i18n = new I18n(router as any)
      expect(i18n.parsePathLang('/index-en.html')).toBe('en')
    })

    it('应支持自定义默认语言参数', () => {
      const i18n = new I18n(router as any)
      expect(i18n.parsePathLang('/guide', 'en')).toBe('en')
    })
  })

  describe('locales 计算属性', () => {
    it('默认语言路径应为无后缀路径', () => {
      router.route.path = '/guide'
      const i18n = new I18n(router as any)
      const zhLocale = i18n.locales.value.find(l => l.id === 'zh-CN')!
      expect(zhLocale.path).toBe('/guide')
    })

    it('非默认语言路径应添加语言后缀', () => {
      router.route.path = '/guide'
      const i18n = new I18n(router as any)
      const enLocale = i18n.locales.value.find(l => l.id === 'en')!
      expect(enLocale.path).toBe('/guide-en')
    })

    it('从非默认语言路由切换时，应正确移除旧语言后缀', () => {
      router.route.path = '/guide-en'
      router.route.meta.lang = 'en'
      const i18n = new I18n(router as any)
      const zhLocale = i18n.locales.value.find(l => l.id === 'zh-CN')!
      const jaLocale = i18n.locales.value.find(l => l.id === 'ja')!
      expect(zhLocale.path).toBe('/guide')
      expect(jaLocale.path).toBe('/guide-ja')
    })

    it('根路径默认语言应构建正确路径', () => {
      router.route.path = '/'
      const i18n = new I18n(router as any)
      const zhLocale = i18n.locales.value.find(l => l.id === 'zh-CN')!
      const enLocale = i18n.locales.value.find(l => l.id === 'en')!
      expect(zhLocale.path).toBe('/')
      expect(enLocale.path).toBe('/index-en')
    })

    it('子路由与父路由路径相同时，默认语言 buildPath 会移除 /index，非默认语言保留', () => {
      router.route.path = '/guide'
      router.route.matched = [
        { path: '/guide', parent: undefined as any },
        { path: '/guide', parent: { path: '/guide' } }
      ]
      const i18n = new I18n(router as any)
      const zhLocale = i18n.locales.value.find(l => l.id === 'zh-CN')!
      const enLocale = i18n.locales.value.find(l => l.id === 'en')!
      // 默认语言：buildPath 移除 /index 后缀
      expect(zhLocale.path).toBe('/guide')
      // 非默认语言：buildPath 保留 /index 并添加语言后缀
      expect(enLocale.path).toBe('/guide/index-en')
    })

    it('路径末尾斜杠应被移除', () => {
      router.route.path = '/guide/'
      const i18n = new I18n(router as any)
      const zhLocale = i18n.locales.value.find(l => l.id === 'zh-CN')!
      expect(zhLocale.path).toBe('/guide')
    })

    it('根路径斜杠不应被移除', () => {
      router.route.path = '/'
      const i18n = new I18n(router as any)
      const zhLocale = i18n.locales.value.find(l => l.id === 'zh-CN')!
      expect(zhLocale.path).toBe('/')
    })
  })

  describe('install()', () => {
    it('应将 i18n 实例注入到应用中', () => {
      const i18n = new I18n(router as any)
      const app = { provide: vi.fn() }
      i18n.install(app as any)
      expect(app.provide).toHaveBeenCalledWith(__I18N_INJECT_KEY__, i18n)
    })
  })
})

describe('useI18n()', () => {
  beforeEach(() => {
    mockGetApp.mockReset()
  })

  it('当不在应用上下文中时应抛出错误', () => {
    mockGetApp.mockReturnValue(null)
    expect(() => useI18n()).toThrow(
      '[vitapress] useI18n must be called in the context of the VitarxApp.'
    )
  })

  it('当 i18n 未安装时应抛出错误', () => {
    mockGetApp.mockReturnValue({ inject: vi.fn().mockReturnValue(null) })
    expect(() => useI18n()).toThrow('[vitapress] failing to get an i18n instance')
  })

  it('当 i18n 已安装时应返回实例', () => {
    const router = createMockRouter()
    const i18nInstance = new I18n(router as any)
    mockGetApp.mockReturnValue({ inject: vi.fn().mockReturnValue(i18nInstance) })
    expect(useI18n()).toBe(i18nInstance)
  })
})
