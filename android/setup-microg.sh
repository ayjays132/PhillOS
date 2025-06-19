#!/bin/bash
# Simple helper to install microG inside a running Waydroid container.
# Requires 'adb' and 'curl' available on the host.
set -euo pipefail

WORKDIR="$(dirname "$0")/downloads"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

# Download microG and F-Droid if not already present
if [ ! -f F-Droid.apk ]; then
  curl -L -o F-Droid.apk https://f-droid.org/F-Droid.apk
fi
if [ ! -f GmsCore.apk ]; then
  curl -L -o GmsCore.apk https://github.com/microg/GmsCore/releases/latest/download/GmsCore.apk
fi
if [ ! -f GsfProxy.apk ]; then
  curl -L -o GsfProxy.apk https://github.com/microg/GsfProxy/releases/latest/download/GsfProxy.apk
fi
if [ ! -f FakeStore.apk ]; then
  curl -L -o FakeStore.apk https://github.com/microg/FakeStore/releases/latest/download/FakeStore.apk
fi

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
