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
          '/public-entry/public': {
            changeOrigin: true,
            // 只代理匿名公开名片 API，避免接管 /public-entry 管理页面路由
            target: 'http://localhost:9101/api/v1',
          },
        },
      },
    },
  };
});
