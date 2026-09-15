import type { Plugin } from 'vite'
import { EXTRACT_PATH, handleExtract } from './api.ts'

/**
 * Mounts the extraction endpoint on the Vite dev server, so `npm run dev` is still
 * a single process and the browser needs no proxy configuration.
 */
export function devApiPlugin(): Plugin {
  return {
    name: 'split-fatoora-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0]
        if (path !== EXTRACT_PATH) {
          next()
          return
        }

        void handleExtract(req, res).catch(next)
      })
    },
  }
}
