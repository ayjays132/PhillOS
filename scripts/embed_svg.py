#!/usr/bin/env python3
"""Compress boot animation SVG and append PHILSVG trailer."""
import argparse
import gzip
from pathlib import Path

TRAILER = b"PHILSVG\x00"  # eight-byte trailer expected by the bootloader

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Source SVG file")
    parser.add_argument("output", help="Destination bootanim.svgz")
    args = parser.parse_args()

    data = Path(args.input).read_bytes()
    compressed = gzip.compress(data)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(compressed + TRAILER)
    print(f"Wrote {out_path}")

if __name__ == "__main__":
    main()
