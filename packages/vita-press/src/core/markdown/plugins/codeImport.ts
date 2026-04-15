import type MarkdownIt from 'markdown-it'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { warn } from 'vitarx-router/file-router'
import type { MarkdownParseEnvContext } from '../../types/index.js'
import { getLineContent } from '../utils/index.js'

/**
 * 代码导入语法解析结果
 */
interface CodeImportInfo {
  /** 导入的文件路径（原始值） */
  filePath: string
  /** 起始行号（1-based），未指定时为 null */
  lineStart: number | null
  /** 结束行号（1-based），未指定时为 null */
  lineEnd: number | null
  /** 显式指定的语言，未指定时为 null */
  language: string | null
}

/**
 * 文件扩展名到语言的映射表
 *
 * 覆盖常见编程和标记语言的扩展名推断
 */
const EXT_TO_LANG: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.vue': 'vue',
  '.py': 'python',
  '.rb': 'ruby',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.sql': 'sql',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.md': 'markdown',
  '.dockerfile': 'dockerfile'
}

/**
 * 代码导入语法正则表达式
 *
 * 支持的格式：
 * - @[code](../foo.js)          基本导入
 * - @[code{1-10}](../foo.js)    行范围导入
 * - @[code js](../foo.js)       指定语言
 * - @[code{1-10} js](../foo.js) 行范围 + 指定语言
 */
const CODE_IMPORT_PATTERN = /^@\[code(?:\{(\d+)-(\d+)})?(?:\s+([^\s\]]+))?]\((.+)\)$/

/**
 * 解析代码导入语法
 *
 * @param line - 单行文本内容
 * @returns 解析结果，不匹配时返回 null
 */
function parseCodeImportSyntax(line: string): CodeImportInfo | null {
  const match = line.trim().match(CODE_IMPORT_PATTERN)
  if (!match) return null

  const [, lineStartStr, lineEndStr, language, filePath] = match

  return {
    filePath: filePath!,
    lineStart: lineStartStr ? parseInt(lineStartStr, 10) : null,
    lineEnd: lineEndStr ? parseInt(lineEndStr, 10) : null,
    language: language || null
  }
}

/**
 * 根据文件扩展名推断代码语言
 *
 * @param filePath - 文件路径
 * @returns 推断的语言名称，未知扩展名返回 'text'
 */
function inferLanguageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()

  const basename = path.basename(filePath).toLowerCase()
  if (basename === 'makefile') return 'makefile'
  if (basename === 'dockerfile') return 'dockerfile'

  return EXT_TO_LANG[ext] || 'text'
}

/**
 * 解析文件路径为绝对路径
 *
 * @param importPath - 导入路径（相对或绝对路径）
 * @param currentFilePath - 当前 Markdown 文件的绝对路径
 * @returns 解析后的绝对路径
 */
function resolveFilePath(importPath: string, currentFilePath: string): string {
  const currentDir = path.dirname(currentFilePath)
  return path.resolve(currentDir, importPath)
}

/**
 * 读取文件内容并提取指定行范围
 *
 * @param filePath - 文件绝对路径
 * @param lineStart - 起始行号（1-based），null 表示从第一行开始
 * @param lineEnd - 结束行号（1-based），null 表示到最后一行
 * @returns 提取的代码内容
 * @throws 文件不存在或行号范围无效时抛出错误
 */
function readCodeContent(
  filePath: string,
  lineStart: number | null,
  lineEnd: number | null
): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[codeImport] 文件不存在: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  if (lineStart === null && lineEnd === null) {
    return content.replace(/\n$/, '')
  }

  const lines = content.split('\n')

  if (content.endsWith('\n') && lines[lines.length - 1] === '') {
    lines.pop()
  }

  const totalLines = lines.length
  const start = lineStart ?? 1
  const end = lineEnd ?? totalLines

  if (start < 1 || start > totalLines) {
    throw new Error(`[codeImport] 起始行号 ${start} 超出范围，文件共 ${totalLines} 行: ${filePath}`)
  }

  if (end < start) {
    throw new Error(`[codeImport] 结束行号 ${end} 不能小于起始行号 ${start}: ${filePath}`)
  }

  if (end > totalLines) {
    throw new Error(`[codeImport] 结束行号 ${end} 超出范围，文件共 ${totalLines} 行: ${filePath}`)
  }

  return lines.slice(start - 1, end).join('\n')
}

/**
 * 代码块导入插件
 *
 * 功能说明：
 * 支持 `@[code]()` 语法从外部文件导入代码片段到 Markdown 文档中。
 *
 * 支持的语法格式：
 * - `@[code](../foo.js)`          完整导入文件内容
 * - `@[code{1-10}](../foo.js)`    仅导入第 1-10 行
 * - `@[code js](../foo.js)`       指定代码语言为 js
 * - `@[code{1-10} js](../foo.js)` 行范围 + 指定语言
 *
 * 语言推断：
 * - 显式指定语言时使用指定值
 * - 未指定时根据文件扩展名自动推断
 * - 无法推断时默认为 'text'
 *
 * 路径解析：
 * - 支持相对路径，基于当前 Markdown 文件所在目录解析
 * - 需要在 env 中传入 `filePath`（当前文件绝对路径）
 *
 * @param md - MarkdownIt 实例
 *
 * @example
 * ```ts
 * import MarkdownIt from 'markdown-it'
 * import { codeImport } from './plugins/codeImport'
 *
 * const md = new MarkdownIt()
 * md.use(codeImport)
 *
 * // 渲染时需要传入文件路径
 * md.render('@[code](./foo.js)', { filePath: '/path/to/current.md' })
 * ```
 */
export function codeImport(md: MarkdownIt): void {
  /**
   * 解析 @[code]() 语法的块级规则
   *
   * 算法流程：
   * 1. 检测当前行是否匹配代码导入语法
   * 2. 从 env 中获取当前文件路径，解析导入路径
   * 3. 读取文件内容，提取指定行范围
   * 4. 推断或使用显式指定的语言
   * 5. 生成 fence token 交给后续插件处理
   */
  function parseCodeImportBlock(
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    if (startLine >= endLine) return false

    const lineContent = getLineContent(state, startLine)
    if (lineContent === null) return false

    const importInfo = parseCodeImportSyntax(lineContent)
    if (!importInfo) return false

    if (silent) return true

    const currentFilePath = (state.env as MarkdownParseEnvContext)?.filePath
    if (!currentFilePath) {
      warn('[codeImport] 未在 env 中设置 filePath，跳过代码导入')
      return false
    }

    const resolvedPath = resolveFilePath(importInfo.filePath, currentFilePath)

    try {
      const codeContent = readCodeContent(resolvedPath, importInfo.lineStart, importInfo.lineEnd)

      const language = importInfo.language || inferLanguageFromPath(importInfo.filePath)

      const token = state.push('fence', 'code', 0)
      token.info = language
      token.content = codeContent
      token.markup = '```'
      token.map = [startLine, startLine + 1]

      state.line = startLine + 1
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      warn(`[codeImport] ${message}，跳过代码导入`)

      return false
    }
  }

  md.block.ruler.before('paragraph', 'codeImport', parseCodeImportBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })
}
