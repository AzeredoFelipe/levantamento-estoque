import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/',
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
      }
    }
  }
})