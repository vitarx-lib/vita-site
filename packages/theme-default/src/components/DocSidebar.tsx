import type { NavEntry, NavGroup, NavItem, TocTree } from 'vitapress'
import { onNavTreeChange, useI18n, useNavTree } from 'vitapress'
import { computed, debounce, For, isArray, onHide, onShow, type View, watch } from 'vitarx'
import { isPathExactMatch, isPathPrefixMatch, RouterLink, useRoute, useRouter } from 'vitarx-router'
import { useSidebarState } from '../shared/menu.js'

export default function DocSidebar(): View {
  const i18n = useI18n()
  let navTree = useNavTree()
  const router = useRouter()
  const state = useSidebarState()
  const route = useRoute()
  const matched = route.matched
  const menuList = computed(() => {
    const currentPath = matched[0]!.path
    const currentLang = i18n.lang.value
    return navTree[currentLang]?.[currentPath] || []
  })

  if (import.meta.hot) {
    onNavTreeChange(tree => {
      navTree = tree
      menuList.notify()
    })
  }

  function getRoutePath(nav: NavEntry) {
    return nav.type === 'group' ? nav.indexPath || nav.path : nav.path
  }

  function buildTocList(nav: NavItem): View | null {
    if (!isPathExactMatch(router.route.path, nav.path)) return null
    const tocList: TocTree[] = router.route.meta['tocList']
    if (!isArray(tocList)) return null
    return (
      <ul class="toc-list">
        <For each={tocList} key={toc => toc.hash + toc.name}>
          {toc => (
            <li class="toc-list__item">
              <RouterLink class="toc-list__link" to={`#${toc.hash}`}>
                {toc.name}
              </RouterLink>
              <ul v-if={toc.children && toc.children.length} class="toc-list">
                <For each={toc.children} key={child => child.hash + child.name}>
                  {child => (
                    <li class="toc-list__item">
                      <RouterLink class="toc-list__link" to={`#${child.hash}`}>
                        {child.name}
                      </RouterLink>
                    </li>
                  )}
                </For>
              </ul>
            </li>
          )}
        </For>
      </ul>
    )
  }

  function matchPath(item: NavEntry): boolean {
    if (item.type === 'group') {
      return isPathPrefixMatch(router.route.path, item.path)
    }
    return isPathExactMatch(router.route.path, item.path)
  }

  function updateActiveToc(hash: string): void {
    if (!hash) return
    const activeTocItems = document.querySelectorAll('.toc-list__link')
    for (let i = 0; i < activeTocItems.length; i++) {
      const item = activeTocItems[i]!
      const href = item.getAttribute('href')!
      if (href.endsWith(hash)) {
        item.classList.add('active')
        continue
      }
      item.classList.remove('active')
    }
  }

  const debouncedScroll = debounce(() => {
    const currentHash = router.route.hash
    if (currentHash) {
      const title = document.querySelector(currentHash)
      if (title) {
        const rect = title.getBoundingClientRect()
        if (rect.top > 64 && rect.bottom >= 0) return
      }
    }
    // 获取所有的标题元素
    let sections = document.querySelectorAll('.paragraph-title a') as NodeListOf<HTMLAnchorElement>
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]!
      if (section.parentElement!.tagName === 'H1') continue
      const rect = section.getBoundingClientRect()
      // 如果该标题进入视口，记录当前标题
      if (rect.top > 64 && rect.bottom >= 0) {
        const newHash = '#' + decodeURIComponent(section.href.split('#')[1]!)
        updateActiveToc(newHash)
        break
      }
    }
  }, 100)

  if (!__VITARX_SSR__) {
    watch(
      () => router.route.hash,
      () => {
        updateActiveToc(router.route.hash)
      },
      { flush: 'post' }
    )
  }

  onShow(() => {
    updateActiveToc(router.route.hash)
    window.addEventListener('scroll', debouncedScroll)
  })

  onHide(() => {
    window.removeEventListener('scroll', debouncedScroll)
  })
  return (
    <aside
      class="sidebar-layout"
      id="sidebar-menu"
      onClick={e => {
        e.stopPropagation()
        state.value = !state.value
      }}
    >
      <ul class="nav-list scrollbar" onClick={e => e.stopPropagation()}>
        <For each={menuList.value} key={item => item.path + item.title}>
          {item => (
            <li class="nav-list__item">
              <a
                class={['nav-list__link', matchPath(item) ? 'active' : '']}
                href={router.buildUrl(getRoutePath(item))}
                onClick={e => {
                  e.preventDefault()
                  router.push(getRoutePath(item))
                }}
              >
                {item.title}
              </a>
              {item.type === 'group' ? (
                <ul class="nav-list__sub">
                  <For<NavItem>
                    each={(item as NavGroup).items}
                    key={child => child.path + child.title}
                  >
                    {child => (
                      <li class="nav-list__sub__item">
                        <RouterLink
                          class="nav-list__link"
                          to={child.path}
                          exactActiveClass="active"
                        >
                          {child.title}
                        </RouterLink>
                        {buildTocList(child)}
                      </li>
                    )}
                  </For>
                </ul>
              ) : (
                buildTocList(item)
              )}
            </li>
          )}
        </For>
      </ul>
    </aside>
  )
}
