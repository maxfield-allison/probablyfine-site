"""Remove the upstream library welcome windows from the arcade's boot desktop."""
from pathlib import Path
import subprocess
from machfs import Volume

source = Path.cwd()
name = "Images/System 7.5 HD.dsk"
original = subprocess.check_output(["git", "show", "HEAD:" + name])
volume = Volume()
volume.read(original)
startup = volume["System Folder"]["Startup Items"]
if "Stickies" in startup:
    del startup["Stickies"]
image = volume.write(len(original), align=512, desktopdb=False, bootable=True)
(source / name).write_bytes(image)
