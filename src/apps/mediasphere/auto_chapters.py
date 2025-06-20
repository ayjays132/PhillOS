"""AutoChapters and SmartEncode utilities.

This file is intended to be compiled to WebAssembly using Pyodide or
similar tooling so it can run in the browser. The module exposes two
simple functions used by the MediaSphere application.
"""
from dataclasses import dataclass
from typing import List, Tuple
import os

@dataclass
class Chapter:
    time: float
    title: str


def auto_chapters(duration: float, count: int = 5) -> List[Chapter]:
    """Generate evenly spaced chapters for a given duration."""
    if count <= 0 or duration <= 0:
        return []
    step = duration / count
    return [Chapter(time=i * step, title=f"Chapter {i+1}") for i in range(count)]


def smart_encode(path: str) -> List[str]:
    """Return simple encoding suggestions based on file size."""
    try:
        size = os.path.getsize(path)
    except OSError:
        size = 0
    if size > 500 * 1024 * 1024:
        return ["--crf=28", "--preset=slow"]
    if size > 100 * 1024 * 1024:
        return ["--crf=24", "--preset=medium"]
    return ["--crf=20", "--preset=fast"]
