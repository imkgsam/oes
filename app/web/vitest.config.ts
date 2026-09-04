import Vue from '@vitejs/plugin-vue';
import VueJsx from '@vitejs/plugin-vue-jsx';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [Vue(), VueJsx()],
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        settings: {
          // happy-dom v20+ disables JS evaluation by default (security fix).
          // Component tests are hermetic: embedded resources and child pages must
          // never turn a DOM render into real network I/O.
          disableCSSFileLoading: true,
          disableIframePageLoading: true,
          disableJavaScriptFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
          navigation: {
            disableChildFrameNavigation: true,
            disableChildPageNavigation: true,
            disableMainFrameNavigation: true,
          },
        },
      },
    },
    include: ['**/*.{unit,component,contract,integration}.spec.ts'],
    // The tenant render suites allocate sizeable Vue component trees. Capping
    // worker pressure keeps the default 5s behavioral timeout meaningful
    // instead of masking host contention with larger per-test timeouts.
    maxWorkers: 4,
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      ...configDefaults.exclude,
      '**/e2e/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/node_modules/**',
      '**/{stylelint,eslint}.config.*',
      '**/{oxfmt,oxlint}.config.*',
    ],
  },
});
