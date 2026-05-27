import type { Locale } from 'vitapress'
import { useI18n } from 'vitapress'
import { For, onHide, shallowRef, Teleport, Transition, type View, watch } from 'vitarx'
import Translation from './icons/Translation.js'
import '../assets/styles/lang.scss'

let id = 0
export interface LangSelectorProps {
  locales: readonly Locale[]
  activeId?: string
  onSelect: (id: string) => void
}

/**
 * 语言选择器组件
 *
 * @param props - 语言选择器属性
 * @param props.locales - 语言列表
 * @param props.activeId - 当前语言的 ID
 * @param props.onSelect - 语言选择回调函数
 */
export default function LangSelector(props: LangSelectorProps): View {
  const i18n = useI18n()
  const visible = shallowRef(false)
  const menuStyle = shallowRef<Record<string, string>>({})
  id++
  const cId = `lang-selector-container-${id}`
  const tId = `lang-selector-target-${id}`
  watch(
    visible,
    () => {
      if (visible.value) {
        document.addEventListener('click', handleClickOutside, true)
      } else {
        document.removeEventListener('click', handleClickOutside, true)
      }
    },
    { flush: 'sync' }
  )

  const toggle = () => {
    visible.value = !visible.value
  }

  const updatePosition = (btn: HTMLButtonElement) => {
    const rect = btn.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const menuWidth = 150
    const rightSpace = viewportWidth - rect.right
    const left = rightSpace >= menuWidth ? `${rect.left}px` : `${rect.right - menuWidth}px`
    menuStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left,
      '--menu-origin': rightSpace >= menuWidth ? 'top left' : 'top right'
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest(`#${cId}`) && !target.closest(`#${tId}`)) {
      visible.value = false
    }
  }

  const handleTriggerClick = (e: MouseEvent) => {
    const btn = e.currentTarget as HTMLButtonElement
    if (!visible.value) {
      updatePosition(btn)
    }
    toggle()
  }

  const handleLocaleClick = (id: string) => {
    visible.value = false
    props.onSelect(id)
  }

  onHide(() => {
    document.removeEventListener('click', handleClickOutside, true)
  })

  return (
    <div class="relative-box">
      <button
        id={tId}
        class="default-theme-action-btn"
        title={i18n.t('header.langSelector', '选择语言')}
        onClick={handleTriggerClick}
      >
        <Translation />
      </button>
      <Teleport to="body">
        <Transition name="lang-menu">
          <div
            v-if={visible.value}
            id={cId}
            class="top-bar-lang-menu"
            role="menu"
            style={menuStyle.value}
          >
            <For each={props.locales} key={locale => JSON.stringify(locale)}>
              {locale => (
                <button
                  class={{ 'top-bar-lang-menu-item': true, active: locale.id === props.activeId }}
                  onClick={() => handleLocaleClick(locale.id)}
                >
                  {locale.name}
                </button>
              )}
            </For>
          </div>
        </Transition>
      </Teleport>
    </div>
  )
}
