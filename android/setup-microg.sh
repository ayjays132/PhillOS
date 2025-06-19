#!/bin/bash
# Simple helper to install microG inside a running Waydroid container.
# Requires 'adb' and 'curl' available on the host.
set -euo pipefail

# Set OFFLINE=1 to skip network downloads. All APKs must then exist in
# the downloads directory.
OFFLINE="${OFFLINE:-0}"

fetch() {
  local url="$1"
  local out="$2"
  if [ -f "$out" ]; then
    echo "Using cached $out"
    return 0
  fi
  if [ "$OFFLINE" = "1" ]; then
    echo "Offline mode enabled and $out is missing" >&2
    exit 1
  fi
  curl -L -o "$out" "$url"
}

WORKDIR="$(dirname "$0")/downloads"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

# Download microG and F-Droid if not already present
fetch https://f-droid.org/F-Droid.apk F-Droid.apk
fetch https://github.com/microg/GmsCore/releases/latest/download/GmsCore.apk GmsCore.apk
fetch https://github.com/microg/GsfProxy/releases/latest/download/GsfProxy.apk GsfProxy.apk
fetch https://github.com/microg/FakeStore/releases/latest/download/FakeStore.apk FakeStore.apk

# Ensure waydroid is running
waydroid container start || true
waydroid session start || true

adb connect 127.0.0.1:5555 || true
adb root || true
adb remount || true

for apk in *.apk; do
  adb push "$apk" /data/local/tmp/
  adb shell pm install -r /data/local/tmp/"$apk"
  adb shell rm /data/local/tmp/"$apk"
done

echo "microG installation complete. Reboot Waydroid for changes to take effect."
