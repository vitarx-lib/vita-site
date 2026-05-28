import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'

/**
 * 从 markdown-it 解析状态中提取指定行的内容
 *
 * 封装 markdown-it block 规则中重复的行内容提取逻辑：
 * 获取行位置信息 → 校验有效性 → 计算偏移 → 截取内容
 *
 * @param state - markdown-it 块级解析状态对象
 * @param lineNum - 行号（0-based）
 * @returns 行内容字符串，行号无效时返回 null
 */
export function getLineContent(state: StateBlock, lineNum: number): string | null {
  const pos = state.bMarks[lineNum]
  const tShift = state.tShift[lineNum]
  const max = state.eMarks[lineNum]

  if (pos === undefined || tShift === undefined || max === undefined) {
    return null
  }

  return state.src.slice(pos + tShift, max).trim()
}
