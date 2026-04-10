import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SolarSystem',
      fileName: 'solar-system-vue'
    },
    rollupOptions: {
      external: ['vue', 'three'],
      output: {
        globals: {
          vue: 'Vue',
          three: 'THREE'
        }
      }
    }
  }
})