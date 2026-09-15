import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { EXTRACT_PATH, handleExtract } from './api.ts'

/**
 * Production server: the extraction endpoint plus the built client.
 *
 * Deliberately dependency-free — the only reason this process exists is to hold
 * the API key somewhere the browser cannot see it.
 */
const PORT = Number(process.env.PORT ?? 5173)
const DIST = resolve(process.cwd(), 'dist')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
}

/** Resolves a URL path inside dist, or null if it escapes the directory. */
function safePath(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/')
  const candidate = resolve(join(DIST, normalize(decoded)))
  if (candidate !== DIST && !candidate.startsWith(DIST + sep)) return null
  return candidate
}

async function serveFile(path: string, res: import('node:http').ServerResponse) {
  const info = await stat(path)
  if (!info.isFile()) throw new Error('not a file')

  const ext = extname(path)
  res.writeHead(200, {
    'content-type': MIME[ext] ?? 'application/octet-stream',
    'content-length': info.size,
    // Vite fingerprints everything under /assets, so those are safe to keep.
    'cache-control': path.includes(`${sep}assets${sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  })
  createReadStream(path).pipe(res)
}

const server = createServer((req, res) => {
  const url = req.url ?? '/'

  if (url === EXTRACT_PATH || url.startsWith(`${EXTRACT_PATH}?`)) {
    void handleExtract(req, res)
    return
  }

  const path = safePath(url)
  if (!path) {
    res.writeHead(400).end('Bad request')
    return
  }

  void serveFile(path, res).catch(() => {
    // Unknown path: hand it to the SPA so client-side routing can answer.
    void serveFile(join(DIST, 'index.html'), res).catch(() => {
      res.writeHead(404).end('Not found')
    })
  })
})

server.listen(PORT, () => {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY && !process.env.AGENTROUTER_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    console.warn('No OCR provider API key is set — receipt scanning will fail until it is.')
  }
  console.log(`Split Fatoora on http://localhost:${PORT}`)
})
