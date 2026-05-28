import { describe, expect, it, vi } from 'vitest'

vi.mock('virtual:vitapress/runtime/site-data', () => ({
  default: { version: '1.0.0', author: 'Alice', repo: 'https://example.com' }
}))

import { useSiteData } from '../../src/client/siteData.js'

describe('useSiteData', () => {
  it('应返回虚拟模块提供的站点数据', () => {
    const data = useSiteData()
    expect(data).toEqual({
      version: '1.0.0',
      author: 'Alice',
      repo: 'https://example.com'
    })
  })

  it('返回的对象应包含预期的属性', () => {
    const data = useSiteData()
    expect(data).toHaveProperty('version', '1.0.0')
    expect(data).toHaveProperty('author', 'Alice')
    expect(data).toHaveProperty('repo', 'https://example.com')
  })

  it('返回值应为只读对象', () => {
    const data = useSiteData()
    expect(Object.isFrozen(data)).toBe(false)
    expect(typeof data).toBe('object')
  })
})
