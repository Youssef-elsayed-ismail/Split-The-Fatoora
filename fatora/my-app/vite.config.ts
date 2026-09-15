import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { devApiPlugin } from './server/devApiPlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The dev API runs in this process, so it needs the key on process.env. Vite only
  // exposes VITE_-prefixed vars to the client, so the AgentRouter token stays server-side.
  
  const env = loadEnv(mode, process.cwd(), '')
  for (const name of [
    'AGENTROUTER_API_KEY',
    'AGENTROUTER_BASE_URL',
    'AGENTROUTER_MODEL',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_MODEL',
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'GEMINI_BASE_URL',
    'GEMINI_MODEL',
    'OCR_PROVIDER',
  ]) {
    if (env[name] && !process.env[name]) process.env[name] = env[name]
  }
  if (env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY
  }

  return {
    plugins: [react(), devApiPlugin()],
    server: {
      host: true,
      allowedHosts: ['raking-scoured-cupcake.ngrok-free.dev'],
    },
  }
})