import * as _locales from 'virtual:vitapress/runtime/locales'
import type { Locale } from '../server/index.js'

export type Locales = readonly Locale[]
export const locales: Locales = _locales.default
