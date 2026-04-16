/**
 * 将文件路径转换为缓存文件名
 *
 * @param filePath - 相对文件路径
 * @returns 缓存文件名
 *
 * @example
 * pathToCacheFileName('docs/README.md') // 'docs_README.md.json'
 * pathToCacheFileName('docs/guide/getting-started.md') // 'docs_guide_getting-started.md.json'
 */
export function pathToCacheFileName(filePath: string): string {
  return filePath.replace(/[\/\\]/g, '_') + '.json'
}
