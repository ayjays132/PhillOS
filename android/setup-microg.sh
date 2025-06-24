#!/bin/bash
# Simple helper to install microG inside a running Waydroid container.
# Requires 'adb', 'curl' and 'jq' on the host.
# Set OFFLINE=1 to skip network downloads. All APKs must then exist in
# the downloads directory.
set -euo pipefail

OFFLINE="${OFFLINE:-0}"
CONFIG_DIR="$(dirname "$0")"
CONFIG="$CONFIG_DIR/package_versions.json"
WORKDIR="$CONFIG_DIR/downloads"
mkdir -p "$WORKDIR"
cd "$WORKDIR"
pkgs=()

check_and_fetch() {
  local name="$1" url="$2" sha="$3" file="$4"
  if [ -f "$file" ]; then
    local cur
    cur=$(sha256sum "$file" | awk '{print $1}')
    if [ "$cur" = "$sha" ]; then
      echo "Using cached $file"
      return
    fi
    echo "Checksum mismatch for $file (expected $sha, got $cur). Updating..."
    rm -f "$file"
  fi
  if [ "$OFFLINE" = "1" ]; then
    echo "Offline mode enabled and $file is missing or invalid" >&2
    exit 1
  fi
  echo "Downloading $name from $url"
  curl -L -o "$file" "$url"
  cur=$(sha256sum "$file" | awk '{print $1}')
  if [ "$cur" != "$sha" ]; then
    echo "Checksum verification failed for $file" >&2
    exit 1
  fi
}

jq -r 'to_entries[] | "\(.key)|\(.value.url)|\(.value.sha256)|\(.value.apk)"' "$CONFIG" | while IFS='|' read -r name url sha file; do
  check_and_fetch "$name" "$url" "$sha" "$file"
  pkgs+=("$file")
done

# Ensure waydroid is running
waydroid container start || true
waydroid session start || true

adb connect 127.0.0.1:5555 || true
adb root || true
adb remount || true

for apk in "${pkgs[@]}"; do
  adb push "$apk" /data/local/tmp/
  adb shell pm install -r /data/local/tmp/"$apk"
  adb shell rm /data/local/tmp/"$apk"
done

echo "microG installation complete. Reboot Waydroid for changes to take effect."
