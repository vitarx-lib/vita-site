import { inject, type ShallowRef } from 'vitarx'

export const NAV_MENU_STATE = Symbol.for('__VITAPRESS_DEFAULT_NAV_MENU_STATE')
export const NAV_SIDEBAR_STATE = Symbol.for('__VITAPRESS_DEFAULT_NAV_SIDEBAR_STATE')
/**
 * 菜单状态Hook函数
 * 用于在组件树中获取菜单的开关状态
 * 必须在GlobalLayout组件的上下文中使用
 *
 * @returns {ShallowRef<boolean>} 返回一个浅层响应式引用，表示菜单的开关状态
 *
 * @throws {Error} 如果不在MenuProvider的上下文中使用，会抛出错误
 */
export function useMenuState(): ShallowRef<boolean> {
  // 通过inject函数注入菜单状态
  const state = inject<ShallowRef<boolean> | undefined>(NAV_MENU_STATE)
  // 检查是否存在注入的状态，如果不存在则抛出错误
  if (!state) {
    throw new Error('useMenuState must be used within a GlobalLayout')
  }
  // 返回注入的菜单状态
  return state
}

/**
 * 使用侧边栏状态的Hook函数
 * 用于在组件中获取侧边栏的开关状态
 * 必须在GlobalLayout组件内部使用
 *
 * @returns {ShallowRef<boolean>} 返回一个响应式的侧边栏状态引用
 * @throws {Error} 如果不在GlobalLayout组件内使用，会抛出错误
 */
export function useSidebarState(): ShallowRef<boolean> {
  // 通过inject获取注入的侧边栏状态
  const state = inject<ShallowRef<boolean> | undefined>(NAV_SIDEBAR_STATE)
  // 检查state是否存在，不存在则抛出错误
  if (!state) {
    throw new Error('useSidebarState must be used within a GlobalLayout')
  }
  // 返回获取到的侧边栏状态
  return state
}
