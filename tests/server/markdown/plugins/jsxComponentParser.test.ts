import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { jsxComponentParser } from '../../../../src/server/markdown/plugins/jsxComponentParser.js'

function createMd(availableComponents: Set<string> = new Set()): MarkdownIt {
  const md = new MarkdownIt({ html: true })
  md.use(jsxComponentParser)
  md.render = ((content: string, env?: Record<string, unknown>) => {
    const fullEnv = {
      availableComponents,
      filePath: '/test.md',
      ...env
    }
    return MarkdownIt.prototype.render.call(md, content, fullEnv)
  }) as typeof md.render
  return md
}

describe('jsxComponentParser', () => {
  describe('已导入的组件', () => {
    it('自闭合组件不应抛出异常', () => {
      const md = createMd(new Set(['Badge']))
      expect(() => md.render('<Badge type="vip" />')).not.toThrow()
    })

    it('成对组件不应抛出异常', () => {
      const md = createMd(new Set(['Button']))
      expect(() => md.render('<Button>Click</Button>')).not.toThrow()
    })

    it('行内组件不应抛出异常', () => {
      const md = createMd(new Set(['Badge']))
      expect(() => md.render('## title <Badge type="vip" />')).not.toThrow()
    })

    it('多个已导入组件不应抛出异常', () => {
      const md = createMd(new Set(['Badge', 'Button', 'Container']))
      expect(() =>
        md.render(`<Badge type="vip" />
<Button>Click</Button>
<Container>Content</Container>`)
      ).not.toThrow()
    })
  })

  describe('未导入的组件', () => {
    it('应抛出包含组件名的异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('<Badge type="vip" />')).toThrow(/Badge/)
    })

    it('应抛出包含文件路径的异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('<Badge />')).toThrow(/\/test\.md/)
    })

    it('应抛出包含修复建议的异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('<Badge />')).toThrow(/import \{ Badge \} from/)
    })

    it('应报告所有未导入的组件', () => {
      const md = createMd(new Set())
      expect(() => md.render('<Badge /><Button />')).toThrow(/Badge.*Button|Button.*Badge/)
    })

    it('部分导入时应只报告未导入的组件', () => {
      const md = createMd(new Set(['Badge']))
      expect(() => md.render('<Badge /><Button />')).toThrow(/Button/)
      expect(() => md.render('<Badge /><Button />')).not.toThrow(/Badge.*未导入|未导入.*Badge/)
    })

    it('行内未导入组件应抛出异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('## title <Badge type="vip" />')).toThrow(/Badge/)
    })

    it('成对未导入组件应抛出异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('<Button>Click</Button>')).toThrow(/Button/)
    })
  })

  describe('无组件的文档', () => {
    it('空文档不应抛出异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('')).not.toThrow()
    })

    it('纯文本不应抛出异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('这是一段普通文本')).not.toThrow()
    })

    it('小写 HTML 标签不应触发校验', () => {
      const md = createMd(new Set())
      expect(() => md.render('<div>content</div>')).not.toThrow()
    })

    it('Markdown 语法不应触发校验', () => {
      const md = createMd(new Set())
      expect(() => md.render('## Heading\n- Item 1\n- Item 2')).not.toThrow()
    })
  })

  describe('availableComponents 为空', () => {
    it('任何大写组件都应抛出异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('<Badge />')).toThrow()
    })
  })

  describe('env 中无 availableComponents', () => {
    it('应跳过校验不抛出异常', () => {
      const md = new MarkdownIt({ html: true })
      md.use(jsxComponentParser)
      expect(() => md.render('<Badge />')).not.toThrow()
    })
  })

  describe('组件名称识别', () => {
    it('应识别驼峰命名组件', () => {
      const md = createMd(new Set())
      expect(() => md.render('<MyButton />')).toThrow(/MyButton/)
    })

    it('应识别全大写组件名', () => {
      const md = createMd(new Set())
      expect(() => md.render('<BUTTON />')).toThrow(/BUTTON/)
    })

    it('应识别包含数字的组件名', () => {
      const md = createMd(new Set())
      expect(() => md.render('<Button2 />')).toThrow(/Button2/)
    })

    it('不应识别小写字母开头的标签', () => {
      const md = createMd(new Set())
      expect(() => md.render('<button />')).not.toThrow()
    })
  })

  describe('复杂场景', () => {
    it('嵌套组件应分别校验', () => {
      const md = createMd(new Set(['Container']))
      expect(() => md.render('<Container><Button /></Container>')).toThrow(/Button/)
    })

    it('多行成对组件应正确校验', () => {
      const md = createMd(new Set())
      expect(() =>
        md.render(`<Card>
## Title
Content
</Card>`)
      ).toThrow(/Card/)
    })

    it('闭合标签中的组件名也应被识别', () => {
      const md = createMd(new Set())
      expect(() => md.render('<Button>Click</Button>')).toThrow(/Button/)
    })

    it('与 Markdown 语法共存时应正确校验', () => {
      const md = createMd(new Set())
      expect(() => md.render(`# Title\n<Badge />\n## Subtitle`)).toThrow(/Badge/)
    })
  })

  describe('未闭合标签检测', () => {
    it('已导入但未闭合的标签应抛出异常', () => {
      const md = createMd(new Set(['Button']))
      expect(() => md.render('<Button>')).toThrow(/未闭合/)
    })

    it('未闭合标签异常应包含组件名', () => {
      const md = createMd(new Set(['Button']))
      expect(() => md.render('<Button>')).toThrow(/Button/)
    })

    it('自闭合标签不应被报告为未闭合', () => {
      const md = createMd(new Set(['Badge']))
      expect(() => md.render('<Badge />')).not.toThrow()
    })

    it('正确闭合的成对标签不应抛出异常', () => {
      const md = createMd(new Set(['Button']))
      expect(() => md.render('<Button>Click</Button>')).not.toThrow()
    })

    it('未闭合标签异常应包含修复建议', () => {
      const md = createMd(new Set(['Button']))
      expect(() => md.render('<Button>')).toThrow(/<\/Button>|\/>/)
    })

    it('多个未闭合标签应全部报告', () => {
      const md = createMd(new Set(['Button', 'Card']))
      expect(() => md.render('<Button>\n<Card>')).toThrow(/Button.*Card|Card.*Button/)
    })

    it('未导入且未闭合的标签应同时报告两类错误', () => {
      const md = createMd(new Set())
      expect(() => md.render('<Button>')).toThrow(/未导入/)
      expect(() => md.render('<Button>')).toThrow(/未闭合/)
    })
  })

  describe('代码围栏中的标签', () => {
    it('代码围栏中的未导入组件不应抛出异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('```jsx\n<Button />\n```')).not.toThrow()
    })

    it('代码围栏中的未闭合标签不应抛出异常', () => {
      const md = createMd(new Set())
      expect(() => md.render('```jsx\n<Button>\n```')).not.toThrow()
    })

    it('行内代码中的组件不应触发校验', () => {
      const md = createMd(new Set())
      expect(() => md.render('Use `<Button />` here')).not.toThrow()
    })

    it('缩进代码块中的组件不应触发校验', () => {
      const md = createMd(new Set())
      expect(() => md.render('    <Button />')).not.toThrow()
    })

    it('代码围栏外的组件仍应被校验', () => {
      const md = createMd(new Set())
      expect(() => md.render('```jsx\n<Button />\n```\n\n<Badge />')).toThrow(/Badge/)
    })
  })
})

describe('extractImportNames', () => {
  it('应从具名导入中提取标识符', async () => {
    const { extractImportNames } =
      await import('../../../../src/server/markdown/utils/importParser.js')
    const names = extractImportNames(['import { Button } from "components"'])
    expect(names).toEqual(new Set(['Button']))
  })

  it('应从多个具名导入中提取标识符', async () => {
    const { extractImportNames } =
      await import('../../../../src/server/markdown/utils/importParser.js')
    const names = extractImportNames(['import { Button, Card } from "components"'])
    expect(names).toEqual(new Set(['Button', 'Card']))
  })

  it('应处理 as 别名', async () => {
    const { extractImportNames } =
      await import('../../../../src/server/markdown/utils/importParser.js')
    const names = extractImportNames(['import { Button as Btn } from "components"'])
    expect(names).toEqual(new Set(['Btn']))
  })

  it('应从默认导入中提取标识符', async () => {
    const { extractImportNames } =
      await import('../../../../src/server/markdown/utils/importParser.js')
    const names = extractImportNames(['import MyComponent from "components"'])
    expect(names).toEqual(new Set(['MyComponent']))
  })

  it('应处理混合导入', async () => {
    const { extractImportNames } =
      await import('../../../../src/server/markdown/utils/importParser.js')
    const names = extractImportNames([
      'import { Button } from "components"',
      'import Card from "ui"'
    ])
    expect(names).toEqual(new Set(['Button', 'Card']))
  })

  it('应跳过非 import 语句', async () => {
    const { extractImportNames } =
      await import('../../../../src/server/markdown/utils/importParser.js')
    const names = extractImportNames(['const a = 1', 'import { Button } from "components"'])
    expect(names).toEqual(new Set(['Button']))
  })

  it('应处理空数组', async () => {
    const { extractImportNames } =
      await import('../../../../src/server/markdown/utils/importParser.js')
    const names = extractImportNames([])
    expect(names).toEqual(new Set())
  })

  it('应处理带分号的 import 语句', async () => {
    const { extractImportNames } =
      await import('../../../../src/server/markdown/utils/importParser.js')
    const names = extractImportNames(['import { Button } from "components";'])
    expect(names).toEqual(new Set(['Button']))
  })

  it('应处理单引号路径', async () => {
    const { extractImportNames } =
      await import('../../../../src/server/markdown/utils/importParser.js')
    const names = extractImportNames(["import { Button } from 'components'"])
    expect(names).toEqual(new Set(['Button']))
  })
})
