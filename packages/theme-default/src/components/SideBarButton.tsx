import { useSidebarState } from '../shared/menu.js'
import Menu from './icons/Menu.js'

export default function SideBarButton() {
  const state = useSidebarState()
  return (
    <button
      class="sidebar-button"
      onClick={() => {
        state.value = !state.value
      }}
    >
      <Menu />
      <svg width="1em" height="1em" viewBox="64 64 896 896">
        <path
          fill="currentColor"
          d="M120 230h496c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm0 424h496c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm784 140H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0-424H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z"
        ></path>
      </svg>
      <span>侧边菜单</span>
    </button>
  )
}
