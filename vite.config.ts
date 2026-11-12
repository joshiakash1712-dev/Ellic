import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  if (isBuild) {
    process.env.NODE_ENV = 'production';
  }

  return {
    base: '/',
    publicDir: 'public',
    plugins: [react(), tailwindcss()],
    assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp'],
    define: {
      ...(isBuild ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {}),
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@designcodeio/threeui/style.css': path.resolve(__dirname, 'src/shaders/threeui.css'),
        '@designcodeio/threeui': path.resolve(__dirname, 'src/shaders/index.ts'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'lucide-react',
        'motion/react',
        'recharts',
        'jspdf',
        'jspdf-autotable',
        'gsap',
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      target: 'es2022',
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 2500,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      modulePreload: {
        resolveDependencies: (_filename, deps) =>
          deps.filter(
            (dep) =>
              !dep.includes('jspdf') &&
              !dep.includes('html2canvas') &&
              !dep.includes('recharts') &&
              !dep.includes('vendor-pdf') &&
              !dep.includes('vendor-charts')
          ),
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('/node_modules/react/') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('/node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('motion') || id.includes('gsap')) return 'vendor-motion';
              if (id.includes('lucide-react')) return 'vendor-icons';
            }
          },
        },
      },
    },
  };
});
