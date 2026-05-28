import { builtinModules } from 'node:module'
import { type Plugin, type UserConfig, version } from 'vite'
import { VitaPressApp } from '../../server/index.js'
import { VIRTUAL_RUNTIME_ENTER_ID } from '../common/constant.js'

/**
 * Server build plugin
 *
 * @param app
 */
export function serverBuildPlugin(app: VitaPressApp): Plugin {
  return {
    name: 'vite-plugin-vita-press-server-build',
    config(): UserConfig {
      return {
        resolve: {
          alias: {
            vitarx: 'vitarx/dist/index.esm-bundler.js'
          }
        },
        ssr: {
          noExternal: true,
          external: [...builtinModules, ...builtinModules.map(m => `node:${m}`)]
        },
        build: {
          outDir: app.tempDir,
          ssr: true,
          [version.startsWith('8') ? 'rolldownOptions' : 'rollupOptions']: {
            input: VIRTUAL_RUNTIME_ENTER_ID,
            output: {
              entryFileNames: 'server-render.js'
            }
          }
        }
      }
    }
  }
}
