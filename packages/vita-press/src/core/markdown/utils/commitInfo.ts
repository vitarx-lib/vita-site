import { execSync } from 'child_process'
import { statSync } from 'node:fs'

const CHINA_TIMEZONE = 'Asia/Shanghai'

/**
 * 将日期转换为 中国时区 ISO 格式字符串
 * @param date - 日期对象或时间戳
 * @returns 中国时区的 ISO 格式时间字符串
 */
function toChinaISODateString(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  return (
    d
      .toLocaleString('sv-SE', {
        timeZone: CHINA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      .replace(' ', 'T') + '+08:00'
  )
}

/**
 * 解析 Git 输出的时间并转换为中国时区
 * @param gitDate - Git 输出的时间字符串
 * @returns 中国时区的 ISO 格式时间字符串
 */
function parseGitDateToChinaTime(gitDate: string): string {
  const date = new Date(gitDate)
  return toChinaISODateString(date)
}

let gitRepositoryCache: boolean | undefined

/**
 * 转义文件路径中的特殊字符，使其兼容 Shell。
 *
 * @param filePath - 输入的文件路径。
 * @returns 转义后的文件路径。
 */
function escapeShellPath(filePath: string): string {
  // 定义需要转义的特殊字符
  const specialChars = /([ #()$&;`|*?~<>^\[\]{}])/g

  // 使用正则表达式匹配并转义特殊字符
  return filePath.replace(specialChars, '\\$1')
}

/**
 * 判断当前目录是否在 Git 仓库内（带缓存）
 * @returns 是否在 Git 仓库内
 */
export function isGitRepositoryPresent(): boolean {
  if (gitRepositoryCache !== undefined) {
    return gitRepositoryCache
  }
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' })
    gitRepositoryCache = true
    return true
  } catch {
    gitRepositoryCache = false
    return false
  }
}

export interface GitCommitInfo {
  /** 所有提交过该文件的作者（去重） */
  authors: string[]
  /** 文件首次提交时间（ISO 格式） */
  createdAt: string
  /** 文件最后修改时间（ISO 格式） */
  lastUpdateAt: string
}

/**
 * 获取本地文件的创建时间和修改时间
 * @param filePath - 文件路径
 * @returns 包含创建时间和修改时间的对象（中国时区）
 */
function getFileStats(filePath: string): { createdAt: string; lastUpdateAt: string } {
  const stats = statSync(filePath)
  const createdAt = toChinaISODateString(stats.birthtime)
  const lastUpdateAt = toChinaISODateString(stats.mtime)
  return { createdAt, lastUpdateAt }
}

/**
 * 获取文件的 Git 提交信息
 * @param filePath - 文件路径
 * @returns 提交信息，若非 Git 环境或文件未追踪则使用本地文件时间
 */
export function getCommitInfo(filePath: string): GitCommitInfo {
  const defaultInfo = (): GitCommitInfo => ({
    authors: [],
    ...getFileStats(filePath)
  })

  if (!isGitRepositoryPresent()) return defaultInfo()

  const escapedPath = escapeShellPath(filePath)

  try {
    const output = execSync(`git log --format="%ad|%an" --date=iso -- ${escapedPath}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()

    if (!output) return defaultInfo()

    const lines = output.split('\n')
    if (lines.length === 0) return defaultInfo()

    const authorSet = new Set<string>()

    for (const line of lines) {
      const separatorIndex = line.lastIndexOf('|')
      if (separatorIndex > 0) {
        const author = line.slice(separatorIndex + 1).trim()
        if (author) authorSet.add(author)
      }
    }

    const firstLine = lines[0]
    const lastLine = lines[lines.length - 1]
    if (!firstLine || !lastLine) return defaultInfo()

    const firstSeparator = firstLine.lastIndexOf('|')
    const lastSeparator = lastLine.lastIndexOf('|')

    const lastUpdateAt = parseGitDateToChinaTime(firstLine.slice(0, firstSeparator).trim())
    const createdAt = parseGitDateToChinaTime(lastLine.slice(0, lastSeparator).trim())

    if (!createdAt || !lastUpdateAt) return defaultInfo()

    return {
      authors: [...authorSet],
      createdAt,
      lastUpdateAt
    }
  } catch {
    return defaultInfo()
  }
}
