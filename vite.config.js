import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TVRS Governance',
        short_name: 'TVRS',
        description: 'Statewide Student Governance & Issue Resolution Network',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/tvrs.jpeg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/tvrs.jpeg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      }
    })
  ],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
