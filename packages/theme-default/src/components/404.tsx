import { useI18n } from 'vitapress'
import type { View } from 'vitarx'
import { RouterLink, useRouter } from 'vitarx-router'
import '../assets/styles/404.scss'

function NotFoundPage(): View {
  const router = useRouter()
  const i18n = useI18n()
  const navBack = () => {
    router.back()
  }
  return (
    <main class="not-found-page">
      <div class="content">
        <h1>
          4<span class="zero">0</span>4
        </h1>
        <h2>{i18n.t('notFoundPage.title', '页面未找到')}</h2>
        <p>{i18n.t('notFoundPage.description', '抱歉，您访问的页面可能已经被移动或删除')}</p>
        <RouterLink to={i18n.buildPath('/')} class="primary-button">
          {i18n.t('notFoundPage.backHome', '返回首页')}
        </RouterLink>
        <button onClick={navBack} class="secondary-button">
          {i18n.t('notFoundPage.goBack', '回退页面')}
        </button>
      </div>
    </main>
  )
}

export default NotFoundPage
