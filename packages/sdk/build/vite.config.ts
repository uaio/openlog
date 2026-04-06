import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    lib: {
      entry: './src/index.ts',
      name: 'OpenLog',
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => {
        if (format === 'es') return 'index.js';
        if (format === 'cjs') return 'index.cjs';
        return 'openlog.iife.js'; // CDN 专用产物
      }
    },
    rollupOptions: {
      external: ['eruda'],
      input: {
        index: './src/index.ts'
      },
      output: {
        exports: 'named'
      }
    }
  },
  plugins: [
    dts(),
    cssInjectedByJsPlugin({ topExecutionPriority: false })
  ],
  test: {
    include: ['**/test/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**']
  }
});
