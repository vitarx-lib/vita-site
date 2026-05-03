/**
 * @module shared/index
 *
 * 共享类型的统一导出入口，供 server / client / common 三层引用。
 * 边界：仅做类型重导出，不包含任何运行时代码。
 */

export type {
  SearchIndex,
  SearchDoc,
  SearchDocBuild,
  SearchSection,
  SearchSectionBuild,
  SearchResult
} from './types.js'
