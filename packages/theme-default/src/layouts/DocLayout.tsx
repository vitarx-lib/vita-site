import { type View } from 'vitarx'
import { RouterView } from 'vitarx-router'
import DocFooter from '../components/DocFooter.js'
import DocSidebar from '../components/DocSidebar.js'
import SideBarButton from '../components/SideBarButton.js'
import { useSidebarState } from '../shared/menu.js'
import '../assets/styles/layout.scss'

export default function DocLayout(): View {
  const sidebarState = useSidebarState()
  function handleClick(e: MouseEvent): void {
    e.stopPropagation()
    const target = e.target as HTMLElement
    if (!target.closest('.v-source-code__copy')) return void 0
    if (target.closest('.success')) return void 0
    const text = target.parentElement!.querySelector('code')?.textContent ?? ''
    navigator.clipboard
      .writeText(text)
      .then(() => {
        target.classList.add('success')
        setTimeout(() => {
          target.classList.remove('success')
        }, 1000)
      })
      .catch(e => {
        alert(`failed to copy code：${String(e)}`)
      })
  }
  return (
    <div
      class="default-theme-doc-layout"
      data-sidebar-open={sidebarState.value}
      onClick={handleClick}
    >
      <DocSidebar />
      <main class="doc-container">
        <RouterView />
        <DocFooter />
      </main>
      <SideBarButton />
    </div>
  )
}
