import { For, shallowRef, type View } from 'vitarx'
import '../assets/styles/dropdown.scss'
import type { NavigateResult } from 'vitarx-router'
import { RouterLink } from 'vitarx-router'

export interface LinkOption {
  /**
   * 选项文本
   */
  text: string
  /**
   * 选项值
   */
  link: string
  /**
   * 是否为外部链接
   *
   * @default false
   */
  isExternal?: boolean
}

export interface LinkDropdownProps {
  /**
   * 触发元素
   */
  children: View | string
  /**
   * 导航选项
   */
  links: LinkOption[]
  /**
   * 点击回调
   */
  callback?: (result: NavigateResult) => void
}

/**
 * 链接下拉菜单
 */
export default function LinkDropdown(props: LinkDropdownProps): View {
  const visible = shallowRef(false)
  const handleClick = (): void => {
    if (window.innerWidth >= 992) {
      visible.value = false
      return void 0
    }
    visible.value = !visible.value
  }
  return (
    <div class="link-dropdown-wrapper">
      <button class="dropdown-trigger" onClick={handleClick}>
        <span class="dropdown-trigger-text">{props.children}</span>
        <svg
          style={{ '--rotate': visible.value ? '180deg' : '0' }}
          class="dropdown-trigger-icon"
          color="currentColor"
          viewBox="0 0 1024 1024"
        >
          <path
            d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3 0.1-12.7-6.4-12.7z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <div style={{ display: visible.value ? 'block' : 'none' }} class="dropdown-menu" role="menu">
        <For each={props.links} key={item => item.link}>
          {option => (
            <RouterLink
              class="dropdown-menu-item"
              to={option.link}
              exactActiveClass="active"
              target={option.isExternal ? '_blank' : undefined}
              callback={props.callback}
            >
              <span class="text-ellipsis">{option.text}</span>
              <svg
                v-if={option.isExternal}
                class="external-link-icon"
                color="currentColor"
                viewBox="0 0 1024 1024"
                role="img"
              >
                <path
                  d="M868 545.5L536.1 163c-12.7-14.7-35.5-14.7-48.3 0L156 545.5c-4.5 5.2-0.8 13.2 6 13.2h81c4.6 0 9-2 12.1-5.5L474 300.9V864c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V300.9l218.9 252.3c3 3.5 7.4 5.5 12.1 5.5h81c6.8 0 10.5-8 6-13.2z"
                  fill="currentColor"
                ></path>
              </svg>
            </RouterLink>
          )}
        </For>
      </div>
    </div>
  )
}
