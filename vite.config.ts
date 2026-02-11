import "dotenv/config"
import path from "path"
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { parseBody, generateProfile } from './server/api.ts'

function apiPlugin(): Plugin {
  return {
    name: 'petster-api',
    configureServer(server) {
      server.middlewares.use('/api/generate-profile', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const body = JSON.parse(await parseBody(req))
          const apiKey = process.env.OPENAI_API_KEY
          if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set')
          }

          const result = await generateProfile(body, apiKey)

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
