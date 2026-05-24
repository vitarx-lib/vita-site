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

/**
 * 监听导航树变化的函数 - 仅在开发模式下有效
 *
 * @param cb - 回调函数，当导航树发生变化时被调用，接收一个 NavTree 类型的参数
 * @example
 * ```js
 * if (import.meta.hot) {
 *   onNavTreeChange((navTree) => {
 *      // 重新渲染导航树UI
 *   })
 * }
 * ```
 */
export function onNavTreeChange(cb: (navTree: NavTree) => void): void {
  // 检查是否处于热更新模式
  if (import.meta.hot) {
    if (import.meta.hot) {
      // 监听 'vitapress:nav-change' 事件
      // 动态导入虚拟模块中的导航树数据
      import.meta.hot.on('vitapress:nav-change', async () => {
        // 调用回调函数，传入默认导出的导航树数据
        const navTree = await import('virtual:vitapress/runtime/nav')
        cb(navTree.default)
      })
    }
  }
}
