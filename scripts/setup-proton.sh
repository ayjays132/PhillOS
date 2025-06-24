#!/bin/sh
set -e

# --- CONFIG ---
VERSION="${PROTON_VERSION:-Proton-proton-10.0-1b}"
SHA="${PROTON_SHA256:-}"
BASE="dist/proton/$VERSION"
URL="${PROTON_DOWNLOAD_URL:-https://steamcdn-a.akamaihd.net/client/$VERSION.tar.gz}"

# --- CHECK EXISTENCE ---
if [ -d "$BASE" ]; then
  echo "✅ Proton $VERSION already present under $BASE"
  exit 0
fi

# --- DOWNLOAD ---
echo "⬇️  Downloading Proton $VERSION..."
mkdir -p "dist/proton"
TMP="/tmp/$VERSION.tar.gz"
curl -L "$URL" -o "$TMP"

# --- VALIDATE CHECKSUM ---
if [ -n "$SHA" ]; then
  ACTUAL=$(sha256sum "$TMP" | awk '{print $1}')
  if [ "$ACTUAL" != "$SHA" ]; then
    echo "❌ Checksum verification failed: expected $SHA, got $ACTUAL" >&2
    rm -f "$TMP"
    exit 1
  fi
  echo "✅ Checksum verified."
fi

# --- EXTRACT CLEANLY ---
mkdir -p "$BASE"
echo "📦 Extracting Proton $VERSION to $BASE"
tar -xf "$TMP" --strip-components=1 -C "$BASE"
rm -f "$TMP"

# --- FINAL CHECK ---
if [ -f "$BASE/proton" ] || [ -f "$BASE/dist" ] || [ "$(ls -A $BASE)" ]; then
  echo "🎉 Proton $VERSION is set up at $BASE"
else
  echo "❌ Extraction failed or $BASE is empty." >&2
  exit 1
fi
