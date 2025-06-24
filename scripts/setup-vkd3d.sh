#!/bin/sh
set -e

# Download and extract vkd3d-proton if not already present
DIR="external/vkd3d"
VERSION="v2.10"
SHA="${VKD3D_SHA256:-e9bf8b39d1f424da27e9c5c14d629abf4760dd9791500c3c2b25d23b9fae2799}"
URL="https://github.com/HansKristian-Work/vkd3d-proton/archive/refs/tags/${VERSION}.tar.gz"

if [ ! -d "$DIR" ]; then
    mkdir -p external
    echo "Fetching vkd3d-proton sources..."
    TMP="/tmp/vkd3d.tar.gz"
    curl -L "$URL" -o "$TMP"
    ACTUAL=$(sha256sum "$TMP" | awk '{print $1}')
    if [ "$ACTUAL" != "$SHA" ]; then
        echo "Checksum verification failed: expected $SHA got $ACTUAL" >&2
        exit 1
    fi
    tar -xf "$TMP" -C external
    mv external/vkd3d-proton-* "$DIR"
    rm -f "$TMP"
fi
