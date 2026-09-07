#!/usr/bin/env python3
"""Self-host the original MacCube CDs as static chunks understood by our Mac build."""
from pathlib import Path
import hashlib
import json
import shutil
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".arcade-cache"
OUT = ROOT / ".arcade-runtime/arcade/assets"

for name, source in json.loads((Path(__file__).parent / "discs.json").read_text()).items():
    path = CACHE / name
    if not path.exists():
        CACHE.mkdir(exist_ok=True)
        partial = path.with_suffix(".partial")
        with urllib.request.urlopen(source["url"], timeout=120) as response, partial.open("wb") as dest:
            shutil.copyfileobj(response, dest)
        partial.replace(path)
    if hashlib.sha256(path.read_bytes()).hexdigest() != source["sha256"]:
        raise RuntimeError(f"Disc checksum changed: {name}")
    dest = OUT / name
    chunks = dest.with_suffix(".iso.chunks")
    chunks.mkdir(parents=True, exist_ok=True)
    size = path.stat().st_size
    dest.with_suffix(".iso.json").write_text(json.dumps({
        "name": name.removesuffix(".iso"), "srcUrl": "/arcade/assets/" + name,
        "fileSize": size,
    }) + "\n")
    with path.open("rb") as disc:
        start = 0
        while data := disc.read(128 * 1024):
            end = start + len(data)
            (chunks / f"{start}-{end}.chunk").write_bytes(data)
            start = end
    print(f"{name}: {size:,} bytes, served entirely from local chunks")
