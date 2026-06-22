import { defineConfig } from '@vben/vite-config';

import { request as requestHttp } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const PUBLIC_SHORT_LINK_PROXY_HOST = 'localhost';
const PUBLIC_SHORT_LINK_PROXY_PORT = 9101;
const publicShortLinkPathPattern = /^\/c(?:\/|$)/;

// shouldProxyPublicShortLinkHtmlRequest detects browser navigations that Vite's SPA fallback would otherwise hijack.
export function shouldProxyPublicShortLinkHtmlRequest(
  request: Pick<IncomingMessage, 'headers' | 'url'>,
) {
  const accept = String(request.headers.accept ?? '');
  return publicShortLinkPathPattern.test(request.url ?? '') && accept.includes('text/html');
}

// publicShortLinkHtmlProxyPlugin forwards local browser ShortLink navigations to the gateway before SPA fallback runs.
function publicShortLinkHtmlProxyPlugin(): Plugin {
  return {
    enforce: 'pre',
    name: 'oes-public-short-link-html-proxy',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!shouldProxyPublicShortLinkHtmlRequest(request)) {
          next();
          return;
        }
        proxyPublicShortLinkRequest(request, response);
      });
    },
  };
}

// proxyPublicShortLinkRequest streams one dev-server ShortLink request to the local API Gateway.
function proxyPublicShortLinkRequest(
  request: IncomingMessage,
  response: ServerResponse,
) {
  const targetUrl = new URL(request.url ?? '/', `http://${PUBLIC_SHORT_LINK_PROXY_HOST}:${PUBLIC_SHORT_LINK_PROXY_PORT}`);
  const proxyRequest = requestHttp(
    {
      headers: {
        ...request.headers,
        host: `${PUBLIC_SHORT_LINK_PROXY_HOST}:${PUBLIC_SHORT_LINK_PROXY_PORT}`,
      },
      hostname: PUBLIC_SHORT_LINK_PROXY_HOST,
      method: request.method,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      port: PUBLIC_SHORT_LINK_PROXY_PORT,
    },
    (proxyResponse) => {
      response.statusCode = proxyResponse.statusCode ?? 502;
      Object.entries(proxyResponse.headers).forEach(([header, value]) => {
        if (value !== undefined) response.setHeader(header, value);
      });
      proxyResponse.pipe(response);
    },
  );

  proxyRequest.on('error', () => {
    if (!response.headersSent) {
      response.statusCode = 502;
      response.setHeader('content-type', 'text/plain; charset=utf-8');
    }
    response.end('Public ShortLink proxy unavailable');
  });

  request.pipe(proxyRequest);
}

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [publicShortLinkHtmlProxyPlugin()],
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 本地联调时直连源码启动的 api-gateway
            target: 'http://localhost:9101/api/v1',
            ws: true,
          },
          '^/c(?:/|$)': {
            changeOrigin: true,
            // 本地联调公开短链时直连 api-gateway 的 root 公开入口
            target: 'http://localhost:9101',
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
