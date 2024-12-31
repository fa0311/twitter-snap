import devServer from '@hono/vite-dev-server'
import {defineConfig} from 'vite'

export default defineConfig({
  ssr: {
    external: ['react', 'react-dom'],
  },
  plugins: [
    devServer({
      entry: 'dev/index.tsx',
    }),
  ],
})
