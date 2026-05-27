import { highlight, search } from '@vitapress/plugin-search/client'
import { useI18n } from 'vitapress'
import { For, nextTick, shallowRef, Teleport, Transition, type View, watch } from 'vitarx'
import { type NavOptions, RouterLink, useRouter } from 'vitarx-router'
import { useMenuState } from '../shared/menu.js'
import ArrowDown from './icons/ArrowDown.js'
import ArrowUp from './icons/ArrowUp.js'
import Clear from './icons/Clear.js'
import Enter from './icons/Enter.js'
import Escape from './icons/Escape.js'
import IconFile from './icons/File.js'
import IconNumber from './icons/IconNumber.js'
import Markdown from './icons/Markdown.js'
import IconSearch from './icons/Search.js'
import '../assets/styles/search.scss'

export default function DocSearch(): View {
  const menuState = useMenuState()
  /** 搜索弹窗是否可见 */
  const visible = shallowRef(false)
  /** 当前查询文本 */
  const query = shallowRef('')
  /** 搜索结果列表（使用 shallowRef 避免深层响应追踪） */
  const results = shallowRef<{ title: string; content: string; to: NavOptions }[]>([])
  /** 索引加载状态 */
  const loading = shallowRef(false)
  /** 选中的结果索引 */
  const selectedIndex = shallowRef<number>(-1)
  /** 获取路由器 */
  const router = useRouter()
  /** 获取国际化 */
  const i18n = useI18n()
  // 监听语言变化并重置搜索结果
  watch(i18n.lang, reset)
  /**
   * 打开弹窗
   */
  function open(): void {
    visible.value = true
    menuState.value = false
    nextTick(() => {
      // 聚焦输入框
      document.getElementById('search-input')?.focus()
    })
  }

  /**
   * 关闭弹窗
   */
  function close(): void {
    visible.value = false
  }

  /**
   * 处理输入事件
   *
   * 输入为空时清空结果，否则调用 search() 异步搜索。
   * search() 内部处理索引懒加载，首次调用时通过虚拟模块加载索引。
   *
   * @param e - 输入事件
   */
  async function handleInput(e: Event): Promise<void> {
    const value = (e.target as HTMLInputElement).value
    results.value = []
    query.value = value

    if (!value.trim()) return

    loading.value = true
    try {
      const response = await search(query.value, { lang: i18n.lang.value })
      if (response.status === 'success') {
        results.value = response.matched.map(result => {
          return {
            title: highlight(value, `${result.title} > ${result.heading}`),
            content: highlight(value, result.content),
            to: {
              index: result.path,
              hash: result.hash ? `#${result.hash}` : ''
            }
          }
        })
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理弹窗内键盘事件
   *
   * - ArrowUp/ArrowDown：上下选择结果
   * - Enter：跳转到选中结果
   * - Escape：关闭弹窗
   *
   * @param e - 键盘事件
   */
  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
    } else if (e.key === 'Enter') {
      if (selectedIndex.value >= 0) {
        const selectedItem = results.value[selectedIndex.value]!
        if (selectedItem) {
          close()
          router.push(selectedItem.to)
        }
      }
    } else if (e.key === 'Escape') {
      close()
    }
  }

  /**
   * 处理遮罩层点击
   *
   * 仅在点击遮罩层本身（非弹窗内容）时关闭，避免误触。
   *
   * @param e - 鼠标事件
   */
  function handleOverlayClick(e: Event): void {
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      close()
    }
  }

  /**
   * 处理清空输入框
   */
  function reset(): void {
    query.value = ''
    results.value = []
    selectedIndex.value = -1
  }

  return (
    <div class="default-theme-search">
      <button
        class="default-theme-action-btn"
        title={i18n.t('header.search', '搜索文档')}
        onClick={open}
      >
        <IconSearch />
      </button>
      <Teleport to="body">
        <Transition name="search">
          <div
            v-if={visible.value}
            class="search-overlay"
            onKeyDown={handleKeydown}
            onClick={handleOverlayClick}
            tabIndex={0}
          >
            <div class="search-dialog">
              <div class="search-header">
                <div class="search-header-input">
                  <IconSearch />
                  <input
                    class="search-input"
                    id="search-input"
                    type="text"
                    placeholder={i18n.t('search.placeholder', '搜索文档')}
                    value={query}
                    onInput={handleInput}
                  />
                  <button v-show={query.value} class="search-clear" onClick={reset}>
                    <Clear />
                  </button>
                </div>
                <button class="search-close" onClick={close}>
                  {i18n.t('search.close', '关闭')}
                </button>
              </div>
              <div class="search-body">
                <div class="search-loading-wrap" v-show={results.value.length === 0}>
                  <Markdown />
                  <p class="search-loading">
                    {loading.value
                      ? i18n.t('search.loading', '搜索中...')
                      : query.value.trim().length
                        ? i18n.t('search.noResults', '未找到相关结果')
                        : i18n.t('search.placeholder', '搜索文档')}
                  </p>
                </div>
                <div class="search-results-wrap" v-show={results.value.length > 0}>
                  <p class="search-results-title">
                    {i18n.t('search.results', '相关内容')} - {results.value.length}
                  </p>
                  <ul class="search-results scrollbar">
                    <For
                      each={results.value}
                      key={item =>
                        `${item.to.index as string}#${item.to.hash}-${item.title}-${item.content}`
                      }
                      children={(item, index) => (
                        <li
                          class="search-result-item"
                          aria-selected={selectedIndex.value === index.value}
                        >
                          <RouterLink class="search-result-link" to={item.to} callback={close}>
                            <IconNumber v-if={item.to.hash} />
                            <IconFile v-else />
                            <div class="search-result-content-wrap">
                              <p class="search-result-title" v-html={item.title} />
                              <p class="search-result-content" v-html={item.content} />
                            </div>
                          </RouterLink>
                        </li>
                      )}
                    />
                  </ul>
                </div>
              </div>
              <div class="search-footer">
                <div class="search-footer-item">
                  <Enter />
                  <span>{i18n.t('search.select', '选择')}</span>
                </div>
                <div class="search-footer-item">
                  <ArrowUp />
                  <ArrowDown />
                  <span>{i18n.t('search.switch', '切换')}</span>
                </div>
                <button class="search-footer-item search-footer-close" onClick={close}>
                  <Escape />
                  <span>{i18n.t('search.close', '关闭')}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  )
}
