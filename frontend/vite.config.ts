import react from '@vitejs/plugin-react'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/**
 * Dev-server middleware that serves video scenario assets from
 * `<repo>/data/video-scenarios/` under `/video-assets/<scenario>/<file>`.
 * Production parity is provided by a matching Flask route in backend/src/app.py.
 */
function videoAssetsPlugin(): Plugin {
  // frontend/ → repo root → data/video-scenarios/
  const root = path.resolve(__dirname, '..', 'data', 'video-scenarios')
  return {
    name: 'video-assets-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/video-assets', (req, res, next) => {
        try {
          const url = (req.url ?? '').split('?')[0]
          // strip leading slash, normalize, and reject path traversal
          const rel = path.posix.normalize(url.replace(/^\/+/, ''))
          if (rel.startsWith('..') || path.isAbsolute(rel)) {
            res.statusCode = 400
            res.end('bad path')
            return
          }
          const abs = path.join(root, rel)
          if (!abs.startsWith(root)) {
            res.statusCode = 400
            res.end('bad path')
            return
          }
          if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
            next()
            return
          }
          const ext = path.extname(abs).toLowerCase()
          const mime =
            ext === '.mp4' ? 'video/mp4'
            : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
            : ext === '.png' ? 'image/png'
            : 'application/octet-stream'
          res.setHeader('Content-Type', mime)
          res.setHeader('Accept-Ranges', 'bytes')
          fs.createReadStream(abs).pipe(res)
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), videoAssetsPlugin()],
  build: {
    outDir: 'static',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'js/index.js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/index.css'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        configure: (proxy) => {
          proxy.on('error', () => { /* backend not running — suppress noise in demo mode */ })
        },
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', () => { /* suppress */ })
        },
      },
    }
  }
})
