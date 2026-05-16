# PDA Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> PDA 侧不拥有 terminal access、access summary、Role、Policy 或授权判定真相；这些服务设计边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。本文只记录 PDA phase 1 实施拆分。

**Goal:** Build the first OES PDA Android device foundation: independent PDA Web, Android Shell, JS Bridge, PDA BFF, login/session bootstrap, device heartbeat, diagnostic logs, scanner diagnostics, camera diagnostics, and installable APK validation.

**Architecture:** PDA is an independent terminal under `app/pda`, not a `tenant-web` variant. Android Shell owns WebView, device adapters, secure token storage, scanner/camera/network capabilities, and vendor-specific adaptation. Vue3 PDA Web owns the acceptance workbench and consumes only the stable JS Bridge and `/pda/*` BFF contracts. API Gateway exposes PDA-specific HTTP contracts while reusing `auth-service`, `identity-service`, and `permission-service` for truth.

**Tech Stack:** Kotlin, Android Gradle Plugin, AndroidX WebView, Vue 3, Vite, TypeScript, Pinia, Vue Router, Vant, NestJS API Gateway, Jest/Vitest, pnpm.

---

## File Structure Map

### Documentation

- Modify: `docs/plans/features/pda-phase-1-foundation.md`
  - Tracks current implementation status as tasks close.
- Modify: `docs/plans/index.md`
  - Adds this implementation plan to the plans index.
- Reference: `docs/architecture/terminals/pda.md`
  - Stable PDA terminal truth source.
- Reference: `docs/contracts/api-gateway/pda-device-bff.md`
  - PDA bootstrap / heartbeat / logs BFF contract.
- Reference: `docs/contracts/pda/js-bridge.md`
  - Android Shell / Vue3 JS Bridge contract.

### PDA Workspace

- Keep: `app/pda/.gitkeep` until `app/pda` contains real tracked files; remove it in the first implementation task when directories are created.
- Create: `app/pda/README.md`
  - Explains local development, web build, Android build, APK install, and truth source links.
- Create: `app/pda/package.json`
  - Independent PDA workspace commands.
- Create: `app/pda/pnpm-workspace.yaml`
  - PDA-local pnpm workspace with `web`.
- Create: `app/pda/.gitignore`
  - Ignores Android and web build outputs.

### PDA Web

- Create: `app/pda/web/package.json`
- Create: `app/pda/web/index.html`
- Create: `app/pda/web/vite.config.ts`
- Create: `app/pda/web/tsconfig.json`
- Create: `app/pda/web/src/main.ts`
- Create: `app/pda/web/src/app.vue`
- Create: `app/pda/web/src/router/index.ts`
- Create: `app/pda/web/src/stores/session.store.ts`
- Create: `app/pda/web/src/api/pda-bff.client.ts`
- Create: `app/pda/web/src/bridge/bridge-client.ts`
- Create: `app/pda/web/src/bridge/mock-bridge.ts`
- Create: `app/pda/web/src/bridge/types.ts`
- Create: `app/pda/web/src/views/login-view.vue`
- Create: `app/pda/web/src/views/workbench-view.vue`
- Create: `app/pda/web/src/views/version-blocked-view.vue`
- Create: `app/pda/web/src/components/device-status-card.vue`
- Create: `app/pda/web/src/components/session-status-card.vue`
- Create: `app/pda/web/src/components/scan-diagnostic-card.vue`
- Create: `app/pda/web/src/components/camera-diagnostic-card.vue`
- Create: `app/pda/web/src/components/log-diagnostic-card.vue`
- Create: `app/pda/web/src/components/network-status-strip.vue`
- Create: `app/pda/web/src/styles/pda-theme.css`
- Create: `app/pda/web/src/tests/bridge-client.spec.ts`
- Create: `app/pda/web/src/tests/session.store.spec.ts`

### PDA Android Shell

- Create: `app/pda/android/settings.gradle.kts`
- Create: `app/pda/android/build.gradle.kts`
- Create: `app/pda/android/gradle.properties`
- Create: `app/pda/android/app/build.gradle.kts`
- Create: `app/pda/android/app/src/main/AndroidManifest.xml`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/MainActivity.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/bridge/OesPdaBridge.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/bridge/BridgeEnvelope.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/device/DeviceInfoProvider.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/network/NetworkStatusObserver.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/security/SecureSessionStore.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/scanner/ScannerAdapter.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/camera/CameraCaptureCoordinator.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/logging/LocalDiagnosticLogStore.kt`
- Create: `app/pda/android/app/src/test/java/com/oes/pda/bridge/BridgeEnvelopeTest.kt`
- Create: `app/pda/android/app/src/test/java/com/oes/pda/device/DeviceInfoProviderTest.kt`

### API Gateway PDA BFF

- Create: `src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-session-bootstrap.use-case.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-heartbeat.use-case.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-logs.use-case.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/interfaces/http/controllers/pda-device.controller.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/interfaces/http/dtos/pda-device.dto.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/interfaces/http/view-models/pda-bootstrap.view-model.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/pda-bff.module.ts`
- Modify: `src/services/api-gateway/src/app.module.ts` or the gateway module registration file used by this repo
  - Registers `PdaBffModule`.
- Test: `src/services/api-gateway/src/modules/pda-bff/interfaces/http/controllers/pda-device.controller.spec.ts`
- Test: `src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-session-bootstrap.use-case.spec.ts`

### API Gateway Auth BFF

- Verify existing terminal-specific controller support from the Terminal Access Policy work.
- Extend or reuse PDA auth controller route group for:
  - `POST /pda/auth/login`
  - `POST /pda/auth/logout`
- Tests should verify terminal is fixed to `PDA`.

## Task 1: PDA Workspace Skeleton

**Files:**

- Create: `app/pda/README.md`
- Create: `app/pda/package.json`
- Create: `app/pda/pnpm-workspace.yaml`
- Create: `app/pda/.gitignore`
- Delete: `app/pda/.gitkeep`

- [x] **Step 1: Create the PDA workspace metadata**

`app/pda/package.json` should expose explicit commands:

```json
{
  "name": "oes-pda-workspace",
  "private": true,
  "type": "module",
  "scripts": {
    "dev:web": "pnpm --filter @oes/pda-web dev",
    "build:web": "pnpm --filter @oes/pda-web build",
    "test:web": "pnpm --filter @oes/pda-web test",
    "typecheck:web": "pnpm --filter @oes/pda-web typecheck"
  },
  "packageManager": "pnpm@10.32.1"
}
```

`app/pda/pnpm-workspace.yaml`:

```yaml
packages:
  - web
```

- [x] **Step 2: Write the PDA README**

The README must link to:

- `docs/architecture/terminals/pda.md`
- `docs/plans/features/pda-phase-1-foundation.md`
- `docs/contracts/api-gateway/pda-device-bff.md`
- `docs/contracts/pda/js-bridge.md`

It must explain that `app/pda/web` and `app/pda/android` are independent from `tenant-web`.

- [x] **Step 3: Verify workspace commands resolve**

Run:

```bash
pnpm --dir app/pda --help
```

Expected:

- pnpm runs from `app/pda`.
- It does not require `app/web` workspace state.

- [ ] **Step 4: Commit**

```bash
git add app/pda/README.md app/pda/package.json app/pda/pnpm-workspace.yaml app/pda/.gitignore
git rm app/pda/.gitkeep
git commit -m "chore: add pda workspace foundation"
```

## Task 1A: Local Android Build Environment

**Status:** completed for Phase 1 local APK validation.

**Files:**

- Create: `app/pda/scripts/android-env.sh`
- Create: `app/pda/scripts/android-doctor.sh`
- Create: `app/pda/scripts/android-gradle.sh`
- Create: `app/pda/android/settings.gradle.kts`
- Create: `app/pda/android/build.gradle.kts`
- Create: `app/pda/android/gradle.properties`
- Create: `app/pda/android/gradlew`
- Create: `app/pda/android/gradle/wrapper/gradle-wrapper.jar`
- Create: `app/pda/android/gradle/wrapper/gradle-wrapper.properties`
- Create: minimal Android app module under `app/pda/android/app`

- [x] **Step 1: Configure explicit local Android environment scripts**

The scripts set Android Studio JBR, Android SDK, ADB path, project Gradle wrapper, and Java proxy arguments derived from `HTTPS_PROXY` / `HTTP_PROXY`.

- [x] **Step 2: Generate project-local Gradle Wrapper**

Generated Gradle Wrapper version: `8.10.2`.

- [x] **Step 3: Verify local Android environment**

Run:

```bash
pnpm --dir app/pda doctor:android
```

Verified:

- Android Studio JBR `21.0.10`
- Android SDK at `$HOME/Library/Android/sdk`
- ADB `37.0.0`
- Gradle Wrapper `8.10.2`

Known non-blocking gap:

- `sdkmanager` is missing because SDK `cmdline-tools` is not installed. This does not block Phase 1 debug APK build, but should be installed before relying on CLI SDK upgrades.

- [x] **Step 4: Verify Android unit test and debug APK build**

Run:

```bash
pnpm --dir app/pda test:android
pnpm --dir app/pda build:android
```

Verified:

- `:app:testDebugUnitTest` passed.
- `:app:assembleDebug` passed.

## Task 2: PDA Web Scaffold

**Files:**

- Create: `app/pda/web/package.json`
- Create: `app/pda/web/index.html`
- Create: `app/pda/web/vite.config.ts`
- Create: `app/pda/web/tsconfig.json`
- Create: `app/pda/web/src/main.ts`
- Create: `app/pda/web/src/app.vue`
- Create: `app/pda/web/src/router/index.ts`
- Create: `app/pda/web/src/styles/pda-theme.css`

- [x] **Step 1: Add the Vue3/Vite/Vant package**

`app/pda/web/package.json` should use a narrow PDA app name and explicit scripts:

```json
{
  "name": "@oes/pda-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "typecheck": "vue-tsc --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-vue": "^6.0.5",
    "@vueuse/core": "^14.2.1",
    "pinia": "^3.0.4",
    "vant": "^4.9.21",
    "vue": "^3.5.30",
    "vue-router": "^4.6.3"
  },
  "devDependencies": {
    "@types/node": "^25.5.0",
    "@vue/test-utils": "^2.4.6",
    "happy-dom": "^20.8.4",
    "typescript": "^5.8.3",
    "vite": "^7.0.0",
    "vitest": "^3.0.0",
    "vue-tsc": "^3.0.0"
  }
}
```

- [x] **Step 2: Add the Vite config**

`app/pda/web/vite.config.ts` should:

- use Vue plugin
- set `base: './'` so Android WebView can load bundled assets from local files
- alias `@` to `src`
- use `happy-dom` for Vitest

- [x] **Step 3: Add the initial app shell**

`app.vue` should render a router view and import `pda-theme.css`.

Routes:

- `/login`
- `/workbench`
- `/version-blocked`
- fallback redirect to `/login`

- [x] **Step 4: Run PDA Web verification**

Run:

```bash
pnpm --dir app/pda install
pnpm --dir app/pda --filter @oes/pda-web typecheck
pnpm --dir app/pda --filter @oes/pda-web build
```

Expected:

- Dependencies install inside the PDA workspace.
- Typecheck passes.
- `app/pda/web/dist` is created with relative asset paths.

Verified:

- `pnpm --dir app/pda typecheck:web` passed.
- `pnpm --dir app/pda test:web` passed.
- `pnpm --dir app/pda build:web` passed.
- `pnpm --dir app/pda build:apk` passed and packaged `app/pda/web/dist` into the Android APK assets.

- [ ] **Step 5: Commit**

```bash
git add app/pda/web app/pda/pnpm-lock.yaml
git commit -m "feat: scaffold pda vue web app"
```

## Task 3: Bridge Client And Mock Runtime

**Files:**

- Create: `app/pda/web/src/bridge/types.ts`
- Create: `app/pda/web/src/bridge/bridge-client.ts`
- Create: `app/pda/web/src/bridge/mock-bridge.ts`
- Create: `app/pda/web/src/tests/bridge-client.spec.ts`

- [ ] **Step 1: Define TypeScript bridge types**

Types must mirror `docs/contracts/pda/js-bridge.md`:

- `BridgeResult<T>`
- `BridgeError`
- `DeviceInfo`
- `NetworkStatus`
- `CameraResult`
- `ScanResultEvent`
- `NetworkChangedEvent`
- `SessionClearedEvent`

- [ ] **Step 2: Implement `bridgeClient`**

`bridgeClient` must:

- expose command methods `getDeviceInfo`, `getNetworkStatus`, `openCamera`, `vibrate`, `beep`, `saveRefreshToken`, `getAccessTokenByRefresh`, `clearSession`, `writeLog`
- expose event subscription methods for `scanResult`, `networkChanged`, `sessionCleared`
- use mock bridge when native bridge is unavailable
- never expose raw Android global objects to pages

- [ ] **Step 3: Implement mock bridge**

Mock bridge should return deterministic development data:

- device model `Mock PDA`
- `capabilities.scanner = true`
- `capabilities.camera = true`
- network status `ONLINE`

It should provide a helper for tests to emit `scanResult`.

- [ ] **Step 4: Add bridge client tests**

Tests must verify:

- command envelope success
- command envelope failure
- mock fallback is used when native bridge is absent
- `scanResult` listener receives payload
- unsubscribe stops receiving events

Run:

```bash
pnpm --dir app/pda --filter @oes/pda-web test
```

Expected:

- Bridge client tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/pda/web/src/bridge app/pda/web/src/tests/bridge-client.spec.ts
git commit -m "feat: add pda bridge client contract"
```

## Task 4: PDA Web Acceptance Workbench

**Files:**

- Create: `app/pda/web/src/views/login-view.vue`
- Create: `app/pda/web/src/views/workbench-view.vue`
- Create: `app/pda/web/src/views/version-blocked-view.vue`
- Create: `app/pda/web/src/components/device-status-card.vue`
- Create: `app/pda/web/src/components/session-status-card.vue`
- Create: `app/pda/web/src/components/scan-diagnostic-card.vue`
- Create: `app/pda/web/src/components/camera-diagnostic-card.vue`
- Create: `app/pda/web/src/components/log-diagnostic-card.vue`
- Create: `app/pda/web/src/components/network-status-strip.vue`
- Create: `app/pda/web/src/stores/session.store.ts`
- Create: `app/pda/web/src/api/pda-bff.client.ts`
- Create: `app/pda/web/src/tests/session.store.spec.ts`

- [ ] **Step 1: Add API client shell**

`pda-bff.client.ts` should define methods:

- `login`
- `logout`
- `bootstrap`
- `heartbeat`
- `uploadLogs`

The client should accept a configurable base URL from Vite env:

- `VITE_PDA_BFF_BASE_URL`

- [ ] **Step 2: Add session store**

The store should keep:

- access token in memory
- account summary
- session summary
- device policy
- workbench enabled cards
- idle deadline

It must not persist refresh token.

- [ ] **Step 3: Add workbench cards**

The acceptance workbench should render:

- session status
- device info
- network status
- scan diagnostic card
- camera diagnostic card
- log diagnostic card

The scan card should display:

- full `scanValue`
- `scanSource`
- `scannerProvider`
- `symbology`
- `rawLength`
- `occurredAt`
- recent records
- clear button

The camera card should display returned local photo metadata and preview if WebView can render the URI.

- [ ] **Step 4: Add idle timeout behavior**

The Web layer should use `devicePolicy.idleTimeoutSeconds`.

For Phase 1:

- user activity resets idle deadline
- timeout calls `clearSession` through bridge
- timeout redirects to `/login`

- [ ] **Step 5: Verify workbench in browser with mock bridge**

Run:

```bash
pnpm --dir app/pda --filter @oes/pda-web dev
```

Expected:

- `/login` renders.
- mock login path can reach `/workbench` when BFF is mocked or bypassed by a development flag.
- workbench cards render with mock bridge data.

- [ ] **Step 6: Run tests and build**

```bash
pnpm --dir app/pda --filter @oes/pda-web test
pnpm --dir app/pda --filter @oes/pda-web build
```

Expected:

- Tests pass.
- Production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add app/pda/web/src
git commit -m "feat: add pda acceptance workbench"
```

## Task 5: Android Shell Skeleton

**Files:**

- Create: `app/pda/android/settings.gradle.kts`
- Create: `app/pda/android/build.gradle.kts`
- Create: `app/pda/android/gradle.properties`
- Create: `app/pda/android/app/build.gradle.kts`
- Create: `app/pda/android/app/src/main/AndroidManifest.xml`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/MainActivity.kt`

- [ ] **Step 1: Create Kotlin Android project**

Use:

- Kotlin
- Android Gradle Plugin
- AndroidX AppCompat or AndroidX Activity
- min SDK compatible with Android 9
- target SDK aligned with available Gradle plugin

Android package:

```text
com.oes.pda
```

- [ ] **Step 2: Add WebView activity**

`MainActivity` should:

- enable JavaScript only for local PDA assets
- load bundled `index.html`
- disable arbitrary remote navigation by default
- set WebView settings required for local assets
- expose only the OES Bridge object

- [ ] **Step 3: Add asset copy strategy**

Android build should consume web build output from:

```text
app/pda/web/dist
```

and package it into:

```text
app/src/main/assets/pda-web
```

- [ ] **Step 4: Build web then Android**

Run:

```bash
pnpm --dir app/pda --filter @oes/pda-web build
```

Then run the Android build command selected by the Gradle project:

```bash
./gradlew :app:assembleDebug
```

from `app/pda/android`.

Expected:

- Debug APK is produced.
- APK includes PDA Web assets.

- [ ] **Step 5: Commit**

```bash
git add app/pda/android
git commit -m "feat: add pda android shell skeleton"
```

## Task 6: Android Bridge Core

**Files:**

- Create: `app/pda/android/app/src/main/java/com/oes/pda/bridge/OesPdaBridge.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/bridge/BridgeEnvelope.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/device/DeviceInfoProvider.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/network/NetworkStatusObserver.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/security/SecureSessionStore.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/logging/LocalDiagnosticLogStore.kt`
- Create: `app/pda/android/app/src/test/java/com/oes/pda/bridge/BridgeEnvelopeTest.kt`
- Create: `app/pda/android/app/src/test/java/com/oes/pda/device/DeviceInfoProviderTest.kt`

- [ ] **Step 1: Implement bridge envelope**

Bridge responses must match:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

and:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "UNKNOWN_ERROR",
    "message": "Unexpected Shell-side failure."
  }
}
```

- [ ] **Step 2: Implement core commands**

Implement:

- `getDeviceInfo`
- `getNetworkStatus`
- `vibrate`
- `beep`
- `saveRefreshToken`
- `getAccessTokenByRefresh`
- `clearSession`
- `writeLog`

`getAccessTokenByRefresh` may call the PDA BFF refresh/auth path when available; before that integration exists, it should return `REFRESH_SESSION_FAILED` instead of exposing refresh token to Vue3.

- [ ] **Step 3: Implement event push helper**

Android Shell should expose a helper that evaluates JavaScript into WebView using the common event envelope.

The helper must support:

- `scanResult`
- `networkChanged`
- `sessionCleared`

- [ ] **Step 4: Add Android unit tests**

Tests must verify:

- success envelope serialization
- error envelope serialization
- device info contains `capabilities`
- no refresh token appears in log output

Run:

```bash
./gradlew :app:testDebugUnitTest
```

from `app/pda/android`.

Expected:

- Unit tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/pda/android/app/src
git commit -m "feat: implement pda android bridge core"
```

## Task 7: Scanner And Camera Integration

**Files:**

- Create: `app/pda/android/app/src/main/java/com/oes/pda/scanner/ScannerAdapter.kt`
- Create: `app/pda/android/app/src/main/java/com/oes/pda/camera/CameraCaptureCoordinator.kt`
- Modify: `app/pda/android/app/src/main/AndroidManifest.xml`
- Modify: `app/pda/android/app/src/main/java/com/oes/pda/MainActivity.kt`

- [x] **Step 1: Implement scanner adapter abstraction**

The adapter must normalize device-specific scanner output into:

- `scanValue`
- `scanSource`
- `scannerProvider`
- `symbology`
- `rawLength`

Phase 1 target source order:

1. manufacturer broadcast / Intent if available
2. keyboard wedge fallback when reliable
3. `UNKNOWN` source for unsupported device behavior

- [x] **Step 2: Add diagnostic logging for scanner input**

Scanner logs may include full `scanValue` only when `diagnosticMode = true`.

Implemented:

- Android Shell dynamically registers scanner broadcast receivers while the PDA app is foregrounded.
- Current known broadcast support:
  - `com.android.server.scannerservice.broadcast`
  - `com.android.server.scannerservice.seuic.scan`
  - `com.scan.onDecodeComplete`
- Current known scan value keys:
  - `scannerdata`
  - `ScannerData`
  - `scan_result`
  - `barcode`
  - `data`
  - `m3scannerdata`
  - `m3scannerdata_raw`
- Android Shell normalizes scanner input into `scanResult` and pushes it into PDA Web through `window.OesPdaBridgeEvents`.
- PDA Web scan diagnostic card displays full `scanValue`, source, provider, raw length, time, and recent local scan history.

Verified:

- `pnpm --dir app/pda test:web` passed.
- `pnpm --dir app/pda typecheck:web` passed.
- `pnpm --dir app/pda test:android` passed.
- `pnpm --dir app/pda build:apk` passed.
- Simulated Cruise / Seuic broadcast was received on real PDA:

```bash
adb shell am broadcast \
  -a com.android.server.scannerservice.broadcast \
  --es scannerdata TEST-SCAN-20260513 \
  --es codetype CODE128
```

- PDA scan diagnostic card displayed `TEST-SCAN-20260513`, `BROADCAST`, `MANUFACTURER_BROADCAST`, and length `18`.

Remaining real-device validation:

- Press physical PDA scan key and scan a real barcode. If no event appears, inspect the scanner app output mode and add the observed vendor action / extra key to `ScannerIntentNormalizer`.

- [x] **Step 3: Implement camera capture**

`openCamera` should:

- request camera permission
- launch camera capture
- return `localUri`, `fileName`, `mimeType`, `sizeBytes`, `width`, `height`
- return `CAMERA_PERMISSION_DENIED` if permission is denied
- return `CAMERA_CAPTURE_CANCELLED` if user cancels

- [ ] **Step 4: Verify on emulator or device**

Build and install verification passed. Manual true-device camera capture still needs one operator tap because the system camera UI requires physical confirmation.

Run:

```bash
./gradlew :app:assembleDebug
```

Install debug APK on the available Android device.

Expected:

- Workbench opens.
- Camera test returns photo metadata.
- Scanner test receives at least one scan path or records unsupported scanner behavior clearly.

- [ ] **Step 5: Commit**

```bash
git add app/pda/android/app/src
git commit -m "feat: add pda scanner and camera bridge"
```

## Task 8: PDA BFF Device Module

**Files:**

- Create: `src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-session-bootstrap.use-case.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-heartbeat.use-case.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-device-logs.use-case.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/interfaces/http/controllers/pda-device.controller.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/interfaces/http/dtos/pda-device.dto.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/interfaces/http/view-models/pda-bootstrap.view-model.ts`
- Create: `src/services/api-gateway/src/modules/pda-bff/pda-bff.module.ts`
- Modify: gateway module registration file
- Test: `src/services/api-gateway/src/modules/pda-bff/interfaces/http/controllers/pda-device.controller.spec.ts`
- Test: `src/services/api-gateway/src/modules/pda-bff/application/use-cases/pda-session-bootstrap.use-case.spec.ts`

- [ ] **Step 1: Add DTOs matching contract docs**

DTOs must validate:

- device metadata
- runtime metadata
- nullable session summary
- log event array
- `diagnosticMode`

- [x] **Step 2: Add bootstrap use case**

For Phase 1, bootstrap should:

- require authenticated PDA session
- return account/session summary from current session context
- call existing permission access summary path or compose action codes through the existing auth-bff mechanism
- return fixed `deviceStatus = ACTIVE`
- return fixed policy defaults:
  - `heartbeatIntervalSeconds = 300`
  - `idleTimeoutSeconds = 900`
  - `minSupportedAppVersion = 1.0.0`
  - `latestAppVersion = 1.0.0`
  - `upgradeRequired = false`
- return workbench mode `FOUNDATION_ACCEPTANCE`

- [x] **Step 3: Add heartbeat use case**

For Phase 1:

- accept unauthenticated or authenticated requests
- store latest device state in the simplest gateway-owned diagnostic persistence available in this repo
- if no persistence is available yet, use an explicit in-memory adapter only for local Phase 1 and mark persistent device registry as Phase 2 in code comments
- return policy defaults

If persistent storage is introduced, it must be treated as gateway diagnostic state, not device registry truth.

- [x] **Step 4: Add logs use case**

For Phase 1:

- accept unauthenticated or authenticated requests
- accept full `scanValue` only when `diagnosticMode = true`
- sanitize password/token-looking fields before retaining recent diagnostic logs
- return `receivedCount`

- [x] **Step 5: Add controller tests**

Tests must verify:

- bootstrap requires auth
- heartbeat accepts `session = null`
- logs accept diagnostic `scanValue`
- logs reject or sanitize token fields
- responses match contract shape

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/pda-bff --runInBand
```

Expected:

- PDA BFF tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/api-gateway/src/modules/pda-bff
git commit -m "feat: add pda device bff foundation"
```

## Task 9: PDA Auth Route Integration

**Files:**

- Modify or create under `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/`
  - PDA auth route for `POST /pda/auth/login`
  - PDA auth route for `POST /pda/auth/logout`
- Modify auth BFF tests that cover terminal-specific login.
- Modify `app/pda/web/src/api/pda-bff.client.ts`
- Modify `app/pda/web/src/stores/session.store.ts`

- [x] **Step 1: Wire PDA login route**

The PDA login route must:

- accept account/password login only in Phase 1
- fix `terminal = PDA`
- reuse auth-service login path
- return existing auth continuation shapes when account selection / MFA is required
- return terminal access denial as defined by the Terminal Access Policy feature

- [ ] **Step 2: Wire PDA logout route**

Logout must:

- call existing session logout/revoke path
- let Vue3 call `clearSession` after successful server logout
- be idempotent from PDA UX perspective

- [x] **Step 3: Update PDA Web client/store**

The PDA Web store must:

- call `/pda/auth/login`
- pass refresh token to `saveRefreshToken`
- keep access token in memory
- call `/pda/session/bootstrap`
- call `/pda/auth/logout` then `clearSession`

- [x] **Step 4: Verify auth route tests**

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers --runInBand
pnpm --dir app/pda --filter @oes/pda-web test
```

Expected:

- PDA login fixes terminal to `PDA`.
- PDA Web store never persists refresh token.

- [ ] **Step 5: Commit**

```bash
git add src/services/api-gateway/src/modules/auth-bff app/pda/web/src/api app/pda/web/src/stores
git commit -m "feat: wire pda auth routes"
```

## Task 10: Integrated APK Build And Field Validation

**Files:**

- Modify: `app/pda/README.md`
- Modify: `docs/plans/features/pda-phase-1-foundation.md`
- Create: `app/pda/scripts/build-debug.sh`

- [ ] **Step 1: Add build script**

`app/pda/scripts/build-debug.sh` should:

- run PDA Web build
- copy dist into Android assets using the Gradle task or shell step chosen in Task 5
- run Android debug assemble
- print APK path

- [ ] **Step 2: Add validation checklist to README**

Checklist must include:

- install APK
- launch app
- login
- bootstrap
- device info
- heartbeat
- scan result
- camera result
- local logs
- manual log upload
- idle timeout
- version blocked flow

- [ ] **Step 3: Run local verification**

Run:

```bash
pnpm --dir app/pda --filter @oes/pda-web test
pnpm --dir app/pda --filter @oes/pda-web build
```

Then from `app/pda/android`:

```bash
./gradlew :app:testDebugUnitTest
./gradlew :app:assembleDebug
```

Expected:

- PDA Web tests pass.
- PDA Web build succeeds.
- Android unit tests pass.
- Debug APK is produced.

- [ ] **Step 4: Run true-device acceptance**

On Dongji / Seuic Cruise Ge Android 9:

- install APK manually
- open App
- verify WebView loads local assets
- run login
- verify workbench cards
- scan a real barcode
- take a photo
- upload logs manually
- leave device idle for 15 minutes and verify automatic logout

- [ ] **Step 5: Update feature packet status**

Update `docs/plans/features/pda-phase-1-foundation.md` with:

- implementation state
- verified device model
- scanner integration source
- camera validation result
- known follow-up issues

- [ ] **Step 6: Commit**

```bash
git add app/pda docs/plans/features/pda-phase-1-foundation.md
git commit -m "chore: validate pda phase 1 foundation"
```

## Cross-Task Verification Matrix

| Capability | Verification |
| --- | --- |
| PDA Web scaffold | `pnpm --dir app/pda --filter @oes/pda-web build` |
| PDA Web tests | `pnpm --dir app/pda --filter @oes/pda-web test` |
| Android Shell unit tests | `./gradlew :app:testDebugUnitTest` from `app/pda/android` |
| Android APK build | `./gradlew :app:assembleDebug` from `app/pda/android` |
| PDA BFF tests | `pnpm --filter api-gateway exec jest src/modules/pda-bff --runInBand` |
| PDA auth tests | `pnpm --filter api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers --runInBand` |
| True-device validation | Manual install and checklist on Dongji / Seuic Cruise Ge Android 9 |

## Implementation Notes

- Do not reuse `tenant-web` layout, Vben components, or route/menu structure.
- Do not expose manufacturer SDK details to Vue3.
- Do not store refresh token in Vue3 localStorage.
- Do not add WMS / MES business scan parsing in Phase 1.
- Do not add full device management UI in Phase 1.
- Keep device registry, device disablement, MDM, and online dashboard as later features.
- Keep photo upload and business attachments as later contracts.
- Keep scanner vendor-specific behavior behind Android Shell adapters.
