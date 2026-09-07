#!/usr/bin/env python3
"""Prepare the pinned Infinite Mac frontend for static hosting on our arcade origin.

Only System 7.5 and the save/export disks are populated. Original source, ROMs,
emulator cores and notices remain in the upstream tree; the changes below replace
Cloudflare-specific media routes with same-origin static files and disable telemetry.
"""
from pathlib import Path
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / ".arcade-tools/infinite-mac"
OUTPUT = ROOT / ".arcade-runtime"
REVISION = "c41a27187117c3c2814570eddd155b8a0d061634"


def run(*args):
    subprocess.run(args, cwd=SOURCE, check=True)


def replace(path, old, new):
    file = SOURCE / path
    text = file.read_text()
    if new in text:
        return
    if text.count(old) != 1:
        raise RuntimeError(f"Upstream patch no longer matches {path}")
    file.write_text(text.replace(old, new))


def main():
    if not SOURCE.exists():
        SOURCE.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "--no-checkout", "--filter=blob:none", "https://github.com/mihaip/infinite-mac.git", str(SOURCE)], check=True)
        run("git", "checkout", "--detach", REVISION)
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=SOURCE, text=True).strip()
    if revision != REVISION:
        raise RuntimeError(f"Expected Infinite Mac {REVISION}, found {revision}")
    replace("scripts/import-disks.py", 'system_filter = "System"  # Just classic images', 'system_filter = "System 7.5 HD"  # Only the arcade system disk')
    replace("scripts/import-disks.py", 'if i in [InfiniteHD.DEFAULT, InfiniteHD.MFS]:', 'if False:  # Arcade does not mount Infinite HD')
    replace("src/defs/cdroms.ts", '''    const response = await fetch(`/CD-ROM/${btoa(cdromURL)}`, {
        method: "PUT",
    });''', '''    const source = new URL(cdromURL, location.href);
    if (source.origin !== location.origin || !source.pathname.startsWith("/arcade/assets/")) {
        throw new Error("Only local arcade disks can be mounted here.");
    }
    const response = await fetch(source.pathname + ".json");''')
    replace("src/emulator/common/common.ts", 'baseUrl: `/CD-ROM/${encoded}`', 'baseUrl: `${new URL(cdrom.srcUrl, globalThis.location.href).pathname}.chunks`')
    replace("src/app/MacLoader.tsx", '                    setCDROMErrorText(`Could not load the CD-ROM: ${error}`);', '''                    setCDROMErrorText(`Could not load the CD-ROM: ${error}`);
                    window.parent.postMessage({type: "arcade-error", detail: "The Mac game disk could not load. Stop and try again."}, document.referrer ? new URL(document.referrer).origin : location.origin);''')
    replace("src/app/Mac.tsx", '                    setEmulatorErrorText(\n                        `The emulator encountered an error:', '''                    window.parent.postMessage({type: "arcade-error", detail: "The Mac emulator encountered an error. Stop and try again."}, document.referrer ? new URL(document.referrer).origin : location.origin);
                    setEmulatorErrorText(
                        `The emulator encountered an error:''')
    # A just-removed iframe can take a moment to release its OPFS handles.
    # Retry only lock contention; genuine storage failures still reach the UI.
    replace("src/emulator/worker/disk-saver.ts", "            await saver.init(opfsRoot);", '''            for (let attempt = 0; ; attempt++) {
                try {
                    await saver.init(opfsRoot);
                    break;
                } catch (error) {
                    saver.close();
                    if (!(error instanceof DOMException) || error.name !== "NoModificationAllowedError" || attempt === 10) throw error;
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }''')
    # Keep a 640x480 guest while using the upstream embed chrome and scaling.
    replace("src/app/Mac.tsx", 'document.body.classList.toggle("embed", screenSizeProp === "embed");', 'document.body.classList.toggle("embed", isEmbed || screenSizeProp === "embed");')
    replace("src/app/Mac.tsx", '!fullscreen && screenSizeProp !== "embed" && !isKeyboardVisible;', '!fullscreen && !isEmbed && screenSizeProp !== "embed" && !isKeyboardVisible;')
    replace("src/app/Mac.tsx", '                    fullscreen ||\n                    // These screen sizes', '                    fullscreen || isEmbed ||\n                    // These screen sizes')
    replace("src/app/Mac.tsx", '                controls={controls}', '                controls={isEmbed ? [] : controls}')
    (SOURCE / "src/lib/varz.ts").write_text('''// This arcade build does not collect emulator telemetry.
export async function get(_name: string): Promise<number> { return 0; }
export async function increment(_name: string, _delta = 1) {}
export async function incrementMulti(_changes: {[name: string]: number}) {}
export async function incrementError(_name: string, _message: string) {}
''')
    (SOURCE / "vite.config.ts").write_text('''import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "node:path";
export default defineConfig({
 build: {outDir:"build", assetsDir:"assets", chunkSizeWarningLimit:4096},
 worker: {format:"es"},
 assetsInclude:["**/*.rom", "**/*.hda", "**/*.media", "**/*nvram.bin", "**/*pram.bin"],
 resolve:{alias:{"@":path.resolve(import.meta.dirname,"src")}},
 plugins:[react(),svgr()]
});
''')
    lock = Path(__file__).parent / "infinite-mac-package-lock.json"
    if lock.exists():
        shutil.copyfile(lock, SOURCE / "package-lock.json")
        run("npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund")
    else:
        raise RuntimeError("The reviewed Infinite Mac dependency lock is missing")
    run("uv", "run", "--frozen", "python", str(Path(__file__).parent / "customize-mac.py"))
    run("uv", "run", "--frozen", "scripts/import-disks.py", "minimal")
    run("uv", "run", "--frozen", "scripts/import-cd-roms.py", "placeholder")
    run("uv", "run", "--frozen", "scripts/import-library.py", "placeholder")
    run("npm", "run", "build")
    OUTPUT.mkdir(exist_ok=True)
    shutil.copytree(SOURCE / "build", OUTPUT, dirs_exist_ok=True)
    shutil.copytree(SOURCE / "Images/build", OUTPUT / "Disk", dirs_exist_ok=True)
    shutil.copytree(ROOT / "public/arcade", OUTPUT / "arcade", dirs_exist_ok=True)
    for disk in (OUTPUT / "arcade/assets").glob("*.hfv"):
        disk.with_suffix(".hfv.json").write_text(json.dumps({
            "name": disk.stem, "srcUrl": "/arcade/assets/" + disk.name,
            "fileSize": disk.stat().st_size, "fetchClientSide": True,
        }) + "\n")
    credits = OUTPUT / "credits"
    credits.mkdir(exist_ok=True)
    shutil.copyfile(SOURCE / "LICENSE", credits / "infinite-mac-LICENSE.txt")
    shutil.copyfile(SOURCE / "README.md", credits / "infinite-mac-README.md")
    shutil.copyfile(Path(__file__), credits / "arcade-build-changes.py")
    (OUTPUT / "upstream-revision.txt").write_text(REVISION + "\n")
    print(f"Arcade runtime prepared at {OUTPUT}")


if __name__ == "__main__":
    main()
