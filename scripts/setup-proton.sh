#!/bin/sh
set -e

VERSION="${PROTON_VERSION:-Proton-8.0}"
SHA="${PROTON_SHA256:-}"
BASE="dist/proton/$VERSION"
URL="${PROTON_DOWNLOAD_URL:-https://steamcdn-a.akamaihd.net/client/$VERSION.tar.gz}"

if [ -d "$BASE" ]; then
  echo "Proton $VERSION already present under $BASE"
  exit 0
fi

echo "Downloading Proton $VERSION..."
mkdir -p "dist/proton"
TMP="/tmp/$VERSION.tar.gz"
curl -L "$URL" -o "$TMP"

if [ -n "$SHA" ]; then
  ACTUAL=$(sha256sum "$TMP" | awk '{print $1}')
  if [ "$ACTUAL" != "$SHA" ]; then
    echo "Checksum verification failed: expected $SHA got $ACTUAL" >&2
    exit 1
  fi
fi

mkdir -p "$BASE"
tar -xf "$TMP" -C "$BASE" --strip-components=1
rm -f "$TMP"

echo "Proton $VERSION extracted to $BASE"
