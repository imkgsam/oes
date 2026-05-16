#!/usr/bin/env sh
set -eu

# Prints the PDA Android build environment and fails when required tools are missing.
. "$(dirname -- "$0")/android-env.sh"

echo "PDA_ROOT=$PDA_ROOT"
echo "PDA_ANDROID_DIR=$PDA_ANDROID_DIR"
echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
echo "GRADLE_USER_HOME=$GRADLE_USER_HOME"
echo

echo "Java:"
java -version
echo

echo "ADB:"
adb version
echo

if command -v sdkmanager >/dev/null 2>&1; then
  echo "sdkmanager=$(command -v sdkmanager)"
else
  echo "sdkmanager=missing (Android Studio can still build with installed SDK; install cmdline-tools later for CLI SDK updates)"
fi
echo

if [ -x "$PDA_ANDROID_DIR/gradlew" ]; then
  echo "Gradle wrapper:"
  "$PDA_ANDROID_DIR/gradlew" -p "$PDA_ANDROID_DIR" -v
else
  echo "Gradle:"
  gradle -v
fi
