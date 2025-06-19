#!/bin/sh
set -e

# Download and extract vkd3d-proton if not already present
DIR="external/vkd3d"
if [ ! -d "$DIR" ]; then
    mkdir -p external
    echo "Fetching vkd3d-proton sources..."
    curl -L https://github.com/HansKristian-Work/vkd3d-proton/archive/refs/tags/v2.10.tar.gz -o /tmp/vkd3d.tar.gz
    tar -xf /tmp/vkd3d.tar.gz -C external
    mv external/vkd3d-proton-* "$DIR"
fi
