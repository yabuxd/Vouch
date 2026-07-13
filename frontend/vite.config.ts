import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function agentDebugLogPlugin(): Plugin {
  const logFiles = [
    path.join(rootDir, 'debug-78e600.log'),
    path.join(rootDir, '.cursor', 'debug-78e600.log'),
  ]
  return {
    name: 'agent-debug-log',
    configureServer(server) {
      server.middlewares.use('/__agent_debug', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          try {
            const line = Buffer.concat(chunks).toString('utf8').trim()
            if (line) {
              for (const logFile of logFiles) {
                fs.mkdirSync(path.dirname(logFile), { recursive: true })
                fs.appendFileSync(logFile, `${line}\n`, 'utf8')
              }
            }
            res.statusCode = 204
            res.end()
          } catch (err) {
            res.statusCode = 500
            res.end(String(err))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), agentDebugLogPlugin()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
  },
})
