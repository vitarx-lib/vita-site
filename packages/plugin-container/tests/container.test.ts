import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { containerPlugin } from '../src/index.js'

function createMdWithPlugin(): MarkdownIt {
  const md = new MarkdownIt()
  const plugin = containerPlugin()
  plugin.markdownIt!(md)
  return md
}

describe('containerPlugin', () => {
  describe('插件结构', () => {
    it('应返回包含正确 name 属性的插件对象', () => {
      const plugin = containerPlugin()

      expect(plugin.name).toBe('vitapress-plugin-container')
    })

    it('应返回包含 markdownIt 方法的插件对象', () => {
      const plugin = containerPlugin()

      expect(typeof plugin.markdownIt).toBe('function')
    })
  })

  describe('info 容器', () => {
    it('应渲染默认标题 INFO', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info\n内容\n:::')

      expect(result).toContain('class="v-state-container info"')
      expect(result).toContain('<h4 class="title">INFO</h4>')
      expect(result).toContain('<svg')
      expect(result).toContain('内容')
    })

    it('应渲染自定义标题', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info:提示\n内容\n:::')

      expect(result).toContain('<h4 class="title">提示</h4>')
    })
  })

  describe('success 容器', () => {
    it('应渲染默认标题 SUCCESS', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: success\n内容\n:::')

      expect(result).toContain('class="v-state-container success"')
      expect(result).toContain('<h4 class="title">SUCCESS</h4>')
    })

    it('应渲染自定义标题', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: success:完成\n内容\n:::')

      expect(result).toContain('<h4 class="title">完成</h4>')
    })
  })

  describe('warning 容器', () => {
    it('应渲染默认标题 WARNING', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: warning\n内容\n:::')

      expect(result).toContain('class="v-state-container warning"')
      expect(result).toContain('<h4 class="title">WARNING</h4>')
    })

    it('应渲染自定义标题', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: warning:注意\n内容\n:::')

      expect(result).toContain('<h4 class="title">注意</h4>')
    })
  })

  describe('error 容器', () => {
    it('应渲染默认标题 ERROR', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: error\n内容\n:::')

      expect(result).toContain('class="v-state-container error"')
      expect(result).toContain('<h4 class="title">ERROR</h4>')
    })

    it('应渲染自定义标题', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: error:错误\n内容\n:::')

      expect(result).toContain('<h4 class="title">错误</h4>')
    })
  })

  describe('渲染结构', () => {
    it('应包含 SVG 图标', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info\n内容\n:::')

      expect(result).toContain('<svg width="18" height="18" viewBox="64 64 896 896" class="icon">')
    })

    it('应包含标题包裹层', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info\n内容\n:::')

      expect(result).toContain('class="v-state-container-header"')
    })

    it('开始标签与结束标签应正确配对', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info\n内容\n:::')

      const openCount = (result.match(/class="v-state-container info"/g) || []).length
      const closeCount = (result.match(/<\/div>/g) || []).length

      expect(openCount).toBe(1)
      expect(closeCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('自定义标题解析', () => {
    it('冒号后无内容时应使用默认标题', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info:\n内容\n:::')

      expect(result).toContain('<h4 class="title">INFO</h4>')
    })

    it('应正确解析含空格的自定义标题', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info:自定义 标题\n内容\n:::')

      expect(result).toContain('<h4 class="title">自定义 标题</h4>')
    })
  })

  describe('验证逻辑', () => {
    it('不应识别未注册的容器类型', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: unknown\n内容\n:::')

      expect(result).not.toContain('class="v-state-container unknown"')
    })

    it('应识别以类型关键字开头的容器', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info-extra\n内容\n:::')

      expect(result).toContain('class="v-state-container info"')
    })
  })

  describe('内容渲染', () => {
    it('应正确渲染容器内的 Markdown 内容', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info\n**粗体** 和 *斜体*\n:::')

      expect(result).toContain('<strong>粗体</strong>')
      expect(result).toContain('<em>斜体</em>')
    })

    it('应正确渲染容器内的多行内容', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info\n第一行\n\n第二行\n:::')

      expect(result).toContain('第一行')
      expect(result).toContain('第二行')
    })

    it('应正确渲染空内容的容器', () => {
      const md = createMdWithPlugin()
      const result = md.render('::: info\n:::')

      expect(result).toContain('class="v-state-container info"')
      expect(result).toContain('<h4 class="title">INFO</h4>')
    })
  })
})
