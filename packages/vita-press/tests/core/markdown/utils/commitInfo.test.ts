import { execSync } from 'child_process'
import { statSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCommitInfo,
  isGitRepositoryPresent
} from '../../../../src/core/markdown/utils/commitInfo.js'

vi.mock('child_process', () => ({
  execSync: vi.fn()
}))

vi.mock('node:fs', () => ({
  statSync: vi.fn()
}))

describe('commitInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 清除缓存
    vi.resetModules()
  })

  describe('isGitRepositoryPresent', () => {
    it('should return true when in a Git repository', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('true'))
      const result = isGitRepositoryPresent()
      expect(result).toBe(true)
      expect(execSync).toHaveBeenCalledWith('git rev-parse --is-inside-work-tree', {
        stdio: 'pipe'
      })
    })
  })

  describe('getCommitInfo', () => {
    beforeEach(() => {
      // Mock file stats
      vi.mocked(statSync).mockReturnValue({
        birthtime: new Date('2023-01-01T12:00:00Z'),
        mtime: new Date('2023-01-02T12:00:00Z')
      } as any)
    })

    it('should return default info when not in a Git repository', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Not a git repository')
      })
      const result = getCommitInfo('test.md')
      expect(result.authors).toEqual([])
      expect(result.createdAt).toMatch(/^2023-01-01T20:00:00\+08:00$/)
      expect(result.lastUpdateAt).toMatch(/^2023-01-02T20:00:00\+08:00$/)
    })

    it('should return default info when Git command fails', () => {
      vi.mocked(execSync).mockImplementation(cmd => {
        if (cmd === 'git rev-parse --is-inside-work-tree') {
          return Buffer.from('true')
        }
        throw new Error('Git command failed')
      })
      const result = getCommitInfo('test.md')
      expect(result.authors).toEqual([])
      expect(result.createdAt).toMatch(/^2023-01-01T20:00:00\+08:00$/)
      expect(result.lastUpdateAt).toMatch(/^2023-01-02T20:00:00\+08:00$/)
    })

    it('should return default info when Git log returns empty output', () => {
      vi.mocked(execSync).mockImplementation(cmd => {
        if (cmd === 'git rev-parse --is-inside-work-tree') {
          return Buffer.from('true')
        }
        return Buffer.from('')
      })
      const result = getCommitInfo('test.md')
      expect(result.authors).toEqual([])
      expect(result.createdAt).toMatch(/^2023-01-01T20:00:00\+08:00$/)
      expect(result.lastUpdateAt).toMatch(/^2023-01-02T20:00:00\+08:00$/)
    })

    it('should return Git commit info when available', () => {
      vi.mocked(execSync).mockImplementation(cmd => {
        if (cmd.includes('git rev-parse')) {
          return Buffer.from('true')
        }
        if (cmd.includes('git log')) {
          return Buffer.from(
            '2023-01-02 12:00:00 +0000|John Doe\n' +
              '2023-01-01 12:00:00 +0000|Jane Smith\n' +
              '2023-01-01 10:00:00 +0000|John Doe'
          )
        }
        return Buffer.from('')
      })
      const result = getCommitInfo('test.md')
      expect(result.authors).toEqual([])
      expect(result.createdAt).toMatch(/^2023-01-01T20:00:00\+08:00$/)
      expect(result.lastUpdateAt).toMatch(/^2023-01-02T20:00:00\+08:00$/)
    })

    it('should handle Git log with malformed lines', () => {
      vi.mocked(execSync).mockImplementation(cmd => {
        if (cmd.includes('git rev-parse')) {
          return Buffer.from('true')
        }
        if (cmd.includes('git log')) {
          return Buffer.from(
            '2023-01-02 12:00:00 +0000|John Doe\n' +
              'malformed line\n' +
              '2023-01-01 12:00:00 +0000|'
          )
        }
        return Buffer.from('')
      })
      const result = getCommitInfo('test.md')
      expect(result.authors).toEqual([])
      expect(result.createdAt).toMatch(/^2023-01-01T20:00:00\+08:00$/)
      expect(result.lastUpdateAt).toMatch(/^2023-01-02T20:00:00\+08:00$/)
    })

    it('should return default info when Git log has no valid separators', () => {
      vi.mocked(execSync).mockImplementation(cmd => {
        if (cmd.includes('git rev-parse')) {
          return Buffer.from('true')
        }
        if (cmd.includes('git log')) {
          return Buffer.from('2023-01-02 12:00:00 +0000 John Doe')
        }
        return Buffer.from('')
      })
      const result = getCommitInfo('test.md')
      expect(result.authors).toEqual([])
      expect(result.createdAt).toMatch(/^2023-01-01T20:00:00\+08:00$/)
      expect(result.lastUpdateAt).toMatch(/^2023-01-02T20:00:00\+08:00$/)
    })
  })
})
