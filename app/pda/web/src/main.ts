import { createPinia } from 'pinia';
import Vant from 'vant';
import 'vant/lib/index.css';
import { createApp } from 'vue';
import App from './app.vue';
import { installBridgeEventSink } from './bridge/bridge-client';
import { router } from './router';
import { sendPdaHeartbeat } from './services/pda-heartbeat';

/** Bootstraps the independent PDA web app inside the Android WebView shell. */
installBridgeEventSink();
createApp(App).use(createPinia()).use(router).use(Vant).mount('#app');
void sendPdaHeartbeat('FOREGROUND');
