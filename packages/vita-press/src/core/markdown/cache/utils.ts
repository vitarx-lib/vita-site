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

/**
 * 将缓存文件名还原为文件路径
 *
 * @param cacheFileName - 缓存文件名
 * @returns 相对文件路径
 *
 * @example
 * cacheFileNameToPath('docs_README.md.json') // 'docs/README.md'
 */
export function cacheFileNameToPath(cacheFileName: string): string {
  const jsonSuffix = '.json'
  if (!cacheFileName.endsWith(jsonSuffix)) {
    return cacheFileName
  }
  const nameWithoutExt = cacheFileName.slice(0, -jsonSuffix.length)
  const mdSuffix = '.md'
  if (!nameWithoutExt.endsWith(mdSuffix)) {
    return nameWithoutExt
  }
  const mdIndex = nameWithoutExt.lastIndexOf(mdSuffix)
  const basePath = nameWithoutExt.slice(0, mdIndex)
  const ext = nameWithoutExt.slice(mdIndex)
  return basePath.replace(/_/g, '/') + ext
}
