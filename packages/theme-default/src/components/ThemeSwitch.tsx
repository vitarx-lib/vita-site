import { useI18n } from 'vitapress'
import { type View } from 'vitarx'
import { useTheme } from '../shared/theme.js'
import Moon from './icons/Moon.js'
import Sun from './icons/Sun.js'

function ThemeSwitch(): View {
  const theme = useTheme()
  const i18n = useI18n()
  return (
    <button
      class="default-theme-action-btn"
      onClick={theme.toggleBright.bind(theme)}
      title={i18n.t('header.toggleTheme', '切换主题')}
    >
      <Sun v-if={theme.bright === 'dark'} />
      <Moon v-else />
    </button>
  )
}

export default ThemeSwitch
