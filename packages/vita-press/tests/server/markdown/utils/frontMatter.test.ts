import { warn } from 'vitarx-router/file-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseFrontMatter } from '../../../../src/server/markdown/utils/index.js'

vi.mock('vitarx-router/file-router', () => ({
  warn: vi.fn()
}))

describe('parseFrontMatter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should parse valid front matter and content', () => {
    const content = `---
title: Test Document
author: John Doe
---

This is the content of the document.
`

    const result = parseFrontMatter(content)

    expect(result).toEqual({
      data: {
        title: 'Test Document',
        author: 'John Doe'
      },
      content: '\nThis is the content of the document.\n'
    })
    expect(warn).not.toHaveBeenCalled()
  })

  it('should return empty data when no front matter exists', () => {
    const content = 'This is just content without front matter.'

    const result = parseFrontMatter(content)

    expect(result).toEqual({
      data: {},
      content: 'This is just content without front matter.'
    })
    expect(warn).not.toHaveBeenCalled()
  })

  it('should handle empty front matter', () => {
    const content = `---
---

Content after empty front matter.
`

    const result = parseFrontMatter(content)

    expect(result.data).toEqual({})
    expect(result.content).toContain('Content after empty front matter.')
    expect(warn).not.toHaveBeenCalled()
  })

  it('should handle front matter with only whitespace', () => {
    const content = `---
  
  
---

Content after whitespace-only front matter.
`

    const result = parseFrontMatter(content)

    expect(result).toEqual({
      data: {},
      content: '\nContent after whitespace-only front matter.\n'
    })
    expect(warn).not.toHaveBeenCalled()
  })

  it('should return empty data and original content when YAML parsing fails', () => {
    const content = `---
title: Test Document
invalid: - key: value
---

Content after invalid YAML.
`

    const result = parseFrontMatter(content, 'test.md')

    expect(result).toEqual({
      data: {},
      content: content
    })
    expect(warn).toHaveBeenCalledWith('Failed to parse front matter', expect.any(String))
  })

  it('should handle front matter that parses to non-object', () => {
    const content = `---
- item1
- item2
---

Content after array front matter.
`

    const result = parseFrontMatter(content)

    expect(result.data).toEqual({})
    expect(result.content).toContain('Content after array front matter.')
    expect(warn).not.toHaveBeenCalled()
  })

  it('should handle front matter that parses to null', () => {
    const content = `---
null
---

Content after null front matter.
`

    const result = parseFrontMatter(content)

    expect(result).toEqual({
      data: {},
      content: '\nContent after null front matter.\n'
    })
    expect(warn).not.toHaveBeenCalled()
  })

  it('should handle empty content', () => {
    const content = ''

    const result = parseFrontMatter(content)

    expect(result).toEqual({
      data: {},
      content: ''
    })
    expect(warn).not.toHaveBeenCalled()
  })

  it('should handle only front matter without content', () => {
    const content = `---
title: Only Front Matter
---
`

    const result = parseFrontMatter(content)

    expect(result).toEqual({
      data: {
        title: 'Only Front Matter'
      },
      content: ''
    })
    expect(warn).not.toHaveBeenCalled()
  })

  it('should handle complex YAML front matter', () => {
    const content = `---
title: Complex Document
metadata:
  tags:
    - test
    - example
  categories:
    - documentation
  published: true
  date: 2023-01-01
---

Content after complex front matter.
`

    const result = parseFrontMatter(content)

    expect(result.data['title']).toBe('Complex Document')
    expect(result.data['metadata']).toEqual({
      tags: ['test', 'example'],
      categories: ['documentation'],
      published: true,
      date: expect.any(Date)
    })
    expect(result.content).toContain('Content after complex front matter.')
    expect(warn).not.toHaveBeenCalled()
  })
})
