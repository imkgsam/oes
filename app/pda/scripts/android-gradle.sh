#!/usr/bin/env sh
set -eu

# Runs Gradle with the PDA Android environment instead of relying on global shell state.
. "$(dirname -- "$0")/android-env.sh"

GRADLE_PROXY_ARGS=""
PROXY_URL="${HTTPS_PROXY:-${HTTP_PROXY:-}}"
if [ -n "$PROXY_URL" ] && [ "${PDA_GRADLE_USE_PROXY:-1}" != "0" ]; then
  PROXY_VALUE="${PROXY_URL#http://}"
  PROXY_VALUE="${PROXY_VALUE#https://}"
  PROXY_VALUE="${PROXY_VALUE%%/*}"
  PROXY_HOST="${PROXY_VALUE%%:*}"
  PROXY_PORT="${PROXY_VALUE##*:}"

  if [ -n "$PROXY_HOST" ] && [ "$PROXY_HOST" != "$PROXY_PORT" ]; then
    GRADLE_PROXY_ARGS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT"
  fi
fi

if [ -x "$PDA_ANDROID_DIR/gradlew" ]; then
  # shellcheck disable=SC2086
  exec "$PDA_ANDROID_DIR/gradlew" -p "$PDA_ANDROID_DIR" $GRADLE_PROXY_ARGS "$@"
fi

# shellcheck disable=SC2086
exec gradle -p "$PDA_ANDROID_DIR" $GRADLE_PROXY_ARGS "$@"
