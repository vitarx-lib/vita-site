import { definePluginClientConfig } from 'vitapress'
import { createMissingRoute } from 'vitarx-router'
import NotFoundPage from './components/404.js'
import GlobalLayout from './layouts/GlobalLayout.js'

export default definePluginClientConfig({
  // 配置全局布局
  layout: GlobalLayout,
  // 拓展 app
  enhanceApp(_app, { router, i18n }) {
    router.onNotFound(target => {
      return createMissingRoute(NotFoundPage, target, {
        title: '404 - Not Found',
        description: 'The page you are looking for does not exist.',
        keywords: '404, Not Found',
        lang: i18n.parsePathLang(target.index)
      })
    })
  }
})
