import { defineConfig } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*.{js,css,html,png,svg,ico}'],
      manifest: {
        name: 'Sistema de Estoque',
        short_name: 'EstoqueApp',
        description: 'Sistema de gerenciamento de estoque',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/imagens/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/imagens/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/js'),
      '@css': path.resolve(__dirname, './frontend/css'),
      '@imgs': path.resolve(__dirname, './frontend/imagens')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    open: '/'
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'frontend/index.html'),
        levantamento: path.resolve(__dirname, 'frontend/html/levantamento.html'),
        acompanhamento: path.resolve(__dirname, 'frontend/html/acompanhamento.html'),
        cadastro: path.resolve(__dirname, 'frontend/html/cadastro.html'),
        cadastroCliente: path.resolve(__dirname, 'frontend/html/cadastroCliente.html'),
        cadastroVendedor: path.resolve(__dirname, 'frontend/html/cadastroVendedor.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'imgs';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  preview: {
    port: 5173,
    open: true
  }
});