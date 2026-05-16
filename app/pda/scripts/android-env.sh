#!/usr/bin/env sh

# Defines the local Android CLI environment used by PDA build scripts.
PDA_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PDA_ANDROID_DIR="$PDA_ROOT/android"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

if [ -z "${JAVA_HOME:-}" ]; then
  if [ -x "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/java" ]; then
    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  else
    JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
    export JAVA_HOME
  fi
fi

export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle}"
mkdir -p "$GRADLE_USER_HOME"

export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
export PDA_ROOT
export PDA_ANDROID_DIR
