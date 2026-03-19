import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'AIConsole',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      input: {
        index: './src/index.ts'
      }
    }
  },
  plugins: [dts()],
  test: {
    include: ['**/test/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**']
  }
});
