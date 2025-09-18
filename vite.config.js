import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from 'path';

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // build: {  
    //   rollupOptions: {  
    //       input: {  
    //           index: './index.html',  
    //           loading: './loading.html'  
    //       }  
    //   }  
    // }
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            // 保持图片文件名不变，不添加哈希值
            if (assetInfo.name.match(/\.(png|jpe?g|gif|svg|webp|ico)$/)) {
              return 'assets/media/[name][extname]';
            }
            // 其他资源保持默认的哈希命名
            return 'assets/[name]-[hash][extname]';
          }
        }
      }
    }
  },
  define: {
    'process.env': {}
  }
}));
