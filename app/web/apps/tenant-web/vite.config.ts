import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 本地联调时直连源码启动的 api-gateway
            target: 'http://localhost:9101/api/v1',
            ws: true,
          },
        },
      },
    },
  };
});
