#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$PROJECT_ROOT/apps/mobile"
ANDROID_DIR="$MOBILE_DIR/android"
MODE="${1:-fast}"

if [[ "$MODE" != "fast" && "$MODE" != "apk" && "$MODE" != "play" ]]; then
  echo "Usage: $0 [fast|apk|play]" >&2
  exit 2
fi

if [[ -z "${JAVA_HOME:-}" && -d /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ]]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
fi

if [[ -n "${JAVA_HOME:-}" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if ! command -v java >/dev/null 2>&1; then
  echo "Java 17 not found. Please run: brew install openjdk@17" >&2
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}" && -d /opt/homebrew/share/android-commandlinetools ]]; then
  export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
fi
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
export NODE_ENV="${NODE_ENV:-production}"

if [[ -z "$ANDROID_SDK_ROOT" ]]; then
  echo "Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT." >&2
  exit 1
fi

cd "$PROJECT_ROOT"
bun install --frozen-lockfile
bun run prepare:mobile:icons

PREBUILD_FINGERPRINT="$({
  shasum \
    apps/mobile/app.json \
    apps/mobile/assets/adaptive-icon-transparent.svg \
    apps/web/public/pwa-512x512.png \
    bun.lock
} | shasum | awk '{print $1}')"
PREBUILD_STAMP="$ANDROID_DIR/.edgeever-prebuild-fingerprint"
PREVIOUS_FINGERPRINT="$(test -f "$PREBUILD_STAMP" && cat "$PREBUILD_STAMP" || true)"

if [[ ! -x "$ANDROID_DIR/gradlew" || "$PREBUILD_FINGERPRINT" != "$PREVIOUS_FINGERPRINT" ]]; then
  echo "Updating Android native project (preserving existing build cache)..."
  cd "$MOBILE_DIR"
  bunx expo prebuild --platform android
  printf '%s' "$PREBUILD_FINGERPRINT" > "$PREBUILD_STAMP"
fi

cd "$ANDROID_DIR"
COMMON_ARGS=(
  --build-cache
  --parallel
  --daemon
  -Dorg.gradle.jvmargs=-Xmx6g\ -XX:MaxMetaspaceSize=1g\ -Dfile.encoding=UTF-8
)

if [[ "$MODE" == "fast" ]]; then
  echo "Building arm64 release test APK..."
  ./gradlew assembleRelease \
    "${COMMON_ARGS[@]}" \
    -PreactNativeArchitectures=arm64-v8a \
    -Pandroid.injected.signing.store.file="$ANDROID_DIR/app/debug.keystore" \
    -Pandroid.injected.signing.store.password=android \
    -Pandroid.injected.signing.key.alias=androiddebugkey \
    -Pandroid.injected.signing.key.password=android
  echo "Done: $ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
  exit 0
fi

: "${ANDROID_KEYSTORE_FILE:?Set ANDROID_KEYSTORE_FILE (local upload keystore path)}"
: "${ANDROID_KEYSTORE_PASSWORD:?Set ANDROID_KEYSTORE_PASSWORD}"
: "${ANDROID_KEY_ALIAS:?Set ANDROID_KEY_ALIAS}"
: "${ANDROID_KEY_PASSWORD:?Set ANDROID_KEY_PASSWORD}"

PLAY_ARCHS="${EDGE_EVER_ANDROID_ARCHS:-armeabi-v7a,arm64-v8a,x86,x86_64}"
APK_ARCHS="${EDGE_EVER_ANDROID_APK_ARCHS:-arm64-v8a}"
KEYSTORE_FILE="$(cd "$(dirname "$ANDROID_KEYSTORE_FILE")" && pwd)/$(basename "$ANDROID_KEYSTORE_FILE")"

if [[ "$MODE" == "apk" ]]; then
  echo "Building production-signed APK（${APK_ARCHS}）..."
  ./gradlew assembleRelease \
    "${COMMON_ARGS[@]}" \
    -PreactNativeArchitectures="$APK_ARCHS" \
    -Pandroid.injected.signing.store.file="$KEYSTORE_FILE" \
    -Pandroid.injected.signing.store.password="$ANDROID_KEYSTORE_PASSWORD" \
    -Pandroid.injected.signing.key.alias="$ANDROID_KEY_ALIAS" \
    -Pandroid.injected.signing.key.password="$ANDROID_KEY_PASSWORD" \
    -Pandroid.injected.signing.store.type=PKCS12
  APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
  APKSIGNER_PATH="$ANDROID_SDK_ROOT/build-tools/36.0.0/apksigner"
  AAPT2_PATH="$ANDROID_SDK_ROOT/build-tools/36.0.0/aapt2"
  test -s "$APK_PATH"
  test -x "$APKSIGNER_PATH"
  test -x "$AAPT2_PATH"
  "$APKSIGNER_PATH" verify --verbose "$APK_PATH"
  "$AAPT2_PATH" dump badging "$APK_PATH" | sed -n '1p'
  shasum -a 256 "$APK_PATH"
  echo "Done: $APK_PATH"
  exit 0
fi

echo "Building Play-signed AAB（${PLAY_ARCHS}）..."
./gradlew bundleRelease \
  "${COMMON_ARGS[@]}" \
  -PreactNativeArchitectures="$PLAY_ARCHS" \
  -Pandroid.injected.signing.store.file="$KEYSTORE_FILE" \
  -Pandroid.injected.signing.store.password="$ANDROID_KEYSTORE_PASSWORD" \
  -Pandroid.injected.signing.key.alias="$ANDROID_KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$ANDROID_KEY_PASSWORD" \
  -Pandroid.injected.signing.store.type=PKCS12

jarsigner -verify app/build/outputs/bundle/release/app-release.aab >/dev/null
test -s app/build/outputs/mapping/release/mapping.txt
echo "Done: $ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
echo "Obfuscation mapping file: $ANDROID_DIR/app/build/outputs/mapping/release/mapping.txt"
