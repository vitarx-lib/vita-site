import siteData from 'virtual:vitapress/runtime/site-data'

export type SiteData = Record<string, any>

/**
 * 获取所有插件合并后的站点数据
 *
 * 返回由插件通过 siteData 字段提供的、经过浅合并的只读对象。
 * 多个插件的同名属性以后注册的为准。
 *
 * @returns 合并后的站点数据
 */
export function useSiteData(): Readonly<SiteData> {
  return siteData
}
