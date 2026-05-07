import navTree from 'virtual:vitapress/runtime/nav'
import type { NavTree } from '../types/index.js'

/**
 * 获取导航树
 *
 * @returns {NavTree} 导航树
 */
export function useNavTree(): NavTree {
  return navTree
}
