/**
 * VitaPress 虚拟模块常量定义
 *
 * 定义所有虚拟模块的 ID 和解析后的 ID，
 * 供 Vite 插件的 resolveId / load 钩子使用。
 */

/** 客户端配置虚拟模块 ID */
export const VIRTUAL_CLIENT_CONFIG_ID = 'virtual:vitapress/runtime/config'

/** 客户端配置虚拟模块解析后的 ID */
export const RESOLVED_CLIENT_CONFIG_ID = '\0' + VIRTUAL_CLIENT_CONFIG_ID

/** 运行时进入虚拟模块 ID */
export const VIRTUAL_RUNTIME_ENTER_ID = 'virtual:vitapress/runtime/enter'
/** 运行时进入虚拟模块解析后的 ID */
export const RESOLVED_RUNTIME_ENTER_ID = '\0' + VIRTUAL_RUNTIME_ENTER_ID

/** body 内容占位符 */
export const BODY_CONTENT_PLACEHOLDER = '<!--ssr-outlet-->'

/** 本地化配置虚拟模块 ID */
export const VIRTUAL_LOCALES_ID = 'virtual:vitapress/runtime/locales'
/** 本地化配置虚拟模块解析后的 ID */
export const RESOLVED_LOCALES_ID = '\0' + VIRTUAL_LOCALES_ID

/** 导航树虚拟模块 ID */
export const VIRTUAL_NAV_ID = 'virtual:vitapress/runtime/nav'
/** 导航树虚拟模块解析后的 ID */
export const RESOLVED_NAV_ID = '\0' + VIRTUAL_NAV_ID
