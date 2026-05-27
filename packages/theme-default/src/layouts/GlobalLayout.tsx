import { provide, shallowRef, type View } from 'vitarx'
import { RouterView } from 'vitarx-router'
import GlobalHeader from '../components/GlobalHeader.js'
import { NAV_MENU_STATE, NAV_SIDEBAR_STATE } from '../shared/menu.js'

/**
 * 全局布局
 *
 * 提供统一的页面结构：固定头部 + 路由内容区
 * @constructor
 */
export default function GlobalLayout(): View {
  const navMenuState = shallowRef(false)
  provide(NAV_MENU_STATE, navMenuState)
  const navSidebarState = shallowRef(false)
  provide(NAV_SIDEBAR_STATE, navSidebarState)
  return (
    <>
      <GlobalHeader />
      <RouterView />
    </>
  )
}
