import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import { describe, expect, it } from 'vitest'
import { getLineContent } from '../../../../src/server/markdown/utils/lineContent.js'

function createMockState(src: string, lines: string[]): StateBlock {
  const bMarks: number[] = []
  const eMarks: number[] = []
  const tShift: number[] = []

  let currentPos = 0
  for (const line of lines) {
    bMarks.push(currentPos)
    eMarks.push(currentPos + line.length)
    const leadingSpaces = line.match(/^(\s*)/)?.[1]?.length ?? 0
    tShift.push(leadingSpaces)
    currentPos += line.length + 1
  }

  return {
    src,
    bMarks,
    eMarks,
    tShift
  } as StateBlock
}

describe('getLineContent', () => {
  it('应正确提取单行内容', () => {
    const lines = ['# Hello World']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    const result = getLineContent(state, 0)

    expect(result).toBe('# Hello World')
  })

  it('应正确提取带缩进的行内容', () => {
    const lines = ['  indented content']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    const result = getLineContent(state, 0)

    expect(result).toBe('indented content')
  })

  it('应正确提取多行文本中的指定行', () => {
    const lines = ['first line', 'second line', 'third line']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    expect(getLineContent(state, 0)).toBe('first line')
    expect(getLineContent(state, 1)).toBe('second line')
    expect(getLineContent(state, 2)).toBe('third line')
  })

  it('应正确处理空行', () => {
    const lines = ['content', '', 'more content']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    expect(getLineContent(state, 0)).toBe('content')
    expect(getLineContent(state, 1)).toBe('')
    expect(getLineContent(state, 2)).toBe('more content')
  })

  it('应对无效行号返回 null', () => {
    const lines = ['only one line']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    expect(getLineContent(state, -1)).toBeNull()
    expect(getLineContent(state, 999)).toBeNull()
  })

  it('应正确处理仅有空格的行', () => {
    const lines = ['   ']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    const result = getLineContent(state, 0)

    expect(result).toBe('')
  })

  it('应正确处理包含特殊字符的行', () => {
    const lines = ['# 标题 🎉 <script>alert("test")</script>']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    const result = getLineContent(state, 0)

    expect(result).toBe('# 标题 🎉 <script>alert("test")</script>')
  })

  it('应正确处理制表符缩进', () => {
    const lines = ['\t\ttabbed content']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    const result = getLineContent(state, 0)

    expect(result).toBe('tabbed content')
  })

  it('应正确处理混合缩进', () => {
    const lines = ['  \t mixed indent']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    const result = getLineContent(state, 0)

    expect(result).toBe('mixed indent')
  })

  it('应正确处理行尾空格', () => {
    const lines = ['content with trailing spaces   ']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    const result = getLineContent(state, 0)

    expect(result).toBe('content with trailing spaces')
  })

  it('应正确处理代码块标记', () => {
    const lines = ['```javascript', 'const x = 1', '```']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    expect(getLineContent(state, 0)).toBe('```javascript')
    expect(getLineContent(state, 1)).toBe('const x = 1')
    expect(getLineContent(state, 2)).toBe('```')
  })

  it('应正确处理列表项', () => {
    const lines = ['- item 1', '  - nested item', '1. ordered item']
    const src = lines.join('\n')
    const state = createMockState(src, lines)

    expect(getLineContent(state, 0)).toBe('- item 1')
    expect(getLineContent(state, 1)).toBe('- nested item')
    expect(getLineContent(state, 2)).toBe('1. ordered item')
  })
})
