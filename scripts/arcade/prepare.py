#!/usr/bin/env python3
"""Build pinned arcade assets. No upstream game download occurs in a visitor's browser.

Run with the requirements.txt environment. Downloads are SHA-256 verified and cached.
DOS bundles use bounded, cacheable chunks; the player assembles only the selected
game, after Play. Original docs stay with each package.
"""
import concurrent.futures
import gzip
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import tarfile
import urllib.request
import zipfile

import pycdlib

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path(os.environ.get("ARCADE_SOURCE_CACHE", ROOT / ".arcade-cache"))
OUT = ROOT / ".arcade-runtime/arcade/assets"
SOURCES = json.loads((Path(__file__).parent / "sources.json").read_text())


def download(name):
    spec = SOURCES[name]
    path = CACHE / name
    if not path.exists():
        partial = path.with_suffix(path.suffix + ".partial")
        with urllib.request.urlopen(spec["url"], timeout=120) as response, partial.open("wb") as target:
            shutil.copyfileobj(response, target)
        partial.replace(path)
    if hashlib.sha256(path.read_bytes()).hexdigest() != spec["sha256"]:
        raise RuntimeError(f"Source checksum changed: {name}. Inspect it before changing the pin.")
    return path


def files(name, prefix="", omit=()):
    with zipfile.ZipFile(CACHE / name) as archive:
        return {n[len(prefix):]: archive.read(n) for n in archive.namelist()
                if n.startswith(prefix) and not n.endswith("/") and
                not any(n[len(prefix):].lower().startswith(p.lower()) for p in omit)}


def iso_files(data):
    iso = pycdlib.PyCdlib()
    iso.open_fp(io.BytesIO(data))
    result = {}
    for root, _, names in iso.walk(iso_path="/"):
        for name in names:
            source = root.rstrip("/") + "/" + name
            target = io.BytesIO()
            iso.get_file_from_iso_fp(target, iso_path=source)
            result[source.lstrip("/").split(";")[0].rstrip(".")] = target.getvalue()
    iso.close()
    return result


def bundle(slug, contents, startup, cycles="auto"):
    config = f"""[sdl]
autolock=false
[dosbox]
machine=svga_s3
memsize=32
[render]
aspect=true
[cpu]
core=auto
cycles={cycles}
[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
[joystick]
joysticktype=none
[autoexec]
@echo off
mount c .
c:
{startup}
"""
    contents[".jsdos/dosbox.conf"] = config.encode()
    contents[".jsdos/jsdos.json"] = b'{"version":"8"}'
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        # libzip in the emulator creates one directory at a time. Explicit
        # parents are required for trees such as X-Wing's TALK/ACKBAR.
        directories = {str(parent) + "/" for name in contents for parent in PurePosixPath(name).parents if str(parent) != "."}
        for directory in sorted(directories, key=lambda name: (name.count("/"), name)):
            if PurePosixPath(directory).is_absolute() or ".." in PurePosixPath(directory).parts:
                raise ValueError(f"Unsafe archive path: {directory}")
            archive.writestr(zipfile.ZipInfo(directory, date_time=(2000, 1, 1, 0, 0, 0)), b"")
        for name, data in sorted(contents.items()):
            if PurePosixPath(name).is_absolute() or ".." in PurePosixPath(name).parts:
                raise ValueError(f"Unsafe archive path: {name}")
            info = zipfile.ZipInfo(name, date_time=(2000, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, data)
    data = stream.getvalue()
    dest = OUT / slug
    dest.mkdir(parents=True, exist_ok=True)
    parts = []
    for i, start in enumerate(range(0, len(data), 16 * 1024 * 1024)):
        piece = data[start:start + 16 * 1024 * 1024]
        digest = hashlib.sha256(piece).hexdigest()
        filename = f"{i:03d}-{digest[:12]}.bin"
        (dest / filename).write_bytes(piece)
        parts.append({"url": filename, "bytes": len(piece), "sha256": digest})
    (dest / "bundle.json").write_text(json.dumps({"bytes": len(data), "parts": parts}) + "\n")
    print(f"{slug}: {len(data):,} bytes, {len(parts)} part(s)", flush=True)


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(download, SOURCES))
    runtime = OUT / "js-dos"
    runtime.mkdir(exist_ok=True)
    with tarfile.open(CACHE / "js-dos-8.4.1.tgz") as archive:
        for member in archive.getmembers():
            prefix = "package/dist/"
            if not member.isfile() or not member.name.startswith(prefix):
                continue
            name = member.name[len(prefix):]
            # Debug maps, symbols and unused experimental backends are not runtime dependencies.
            if name.endswith((".map", ".symbols", ".ts")) or "-jspi" in name:
                continue
            dest = runtime / name
            if not dest.resolve().is_relative_to(runtime.resolve()):
                raise ValueError("Unsafe runtime archive path")
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(archive.extractfile(member).read())
    # The upstream UI requests top-level keyboard lock even inside an iframe.
    # The rejected optional API promise must not become an unhandled page error.
    ui = runtime / "js-dos.js"
    code = ui.read_text()
    keyboard_lock = 'n.lock(["KeyW","Escape"])'
    if code.count(keyboard_lock) != 1:
        raise RuntimeError("The reviewed js-dos keyboard-lock patch no longer matches")
    ui.write_text(code.replace(keyboard_lock, keyboard_lock + '.catch(()=>{})'))
    pinball = OUT / "space-cadet"
    pinball.mkdir(exist_ok=True)
    for name in ("3DPinballSpaceCadet.htm", "3DPinballSpaceCadet.js"):
        shutil.copyfile(CACHE / name, pinball / name)
    html = pinball / "3DPinballSpaceCadet.htm"
    html.write_text(html.read_text().replace('</body>', '<script defer src="/arcade/runtime/pinball.js"></script></body>'))
    for disk in (Path(__file__).parent / "mac").glob("*.hfv.gz"):
        (OUT / disk.name.removesuffix(".gz")).write_bytes(gzip.decompress(disk.read_bytes()))

    bundle("hocus-pocus", files("hocus.zip", "HocusPoc/HOCUS/"), "HOCUS.EXE", "10000")
    bundle("mystic-towers", files("mystic-full.zip", "mysttow/", ("cd/",)), "TOWERS.EXE", "10000")
    bundle("grand-theft-auto", files("gta.zip"), "cd gtados\ngta8.exe", "max")
    # The CD's files are writable on C: so pilot profiles can be created.
    xwing = iso_files(files("xwing.zip")["StarWarsXWing.iso"])
    bundle("x-wing", xwing, "mount d . -t cdrom\nXWINGCD.BAT", "25000")
    kyrandia = files("kyrandia.zip", "kyra2/", ("cd/", "IAFIX.BAT"))
    bundle("hand-of-fate", kyrandia, "mount d . -t cdrom\ncd HOFCD\ncopy /y sb16\\*.* .\nHOFCD.EXE", "20000")
    busy = files("busytown.zip", "Busytow2/", ("IAFIX.BAT",))
    busy = {n: d for n, d in busy.items() if not n.lower().endswith((".sub", ".ccd", ".nfo", ".ba1"))}
    bundle("busytown", busy, "imgmount d CD/BUSYWORKS.cue -t cdrom\ncd HTW\ncall HTW.BAT", "20000")


if __name__ == "__main__":
    main()
