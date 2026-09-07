# Building the arcade

The collection and game pages belong to the Astro site. `arcade.probablyfine.dev`
serves the emulator code, game bundles, Mac system disk and CD images from a
separate static nginx image. The visitor's browser runs the machines. The cluster
does not create a VM or session for each player, and no runtime media request
needs Internet Archive, Infinite Mac or DOS.Zone.

## Build and check

```sh
pnpm install --frozen-lockfile
pnpm build
docker build -f Dockerfile.arcade -t probablyfine-arcade:review .
docker run --rm -p 127.0.0.1:4127:8080 probablyfine-arcade:review
```

The runtime root redirects to the collection; `/healthz` checks nginx. Preview
the Astro site separately with `PUBLIC_ARCADE_ORIGIN` pointing to the local
runtime. A loopback review needs its exact parent origin added to a **temporary**
copy of the runtime's `frame-ancestors` policy. Keep that allowance out of the
production configuration. Serve private drafts on loopback only.

`pnpm check:arcade` expects the built site at `http://localhost:4324`; override
`ARCADE_SITE_URL` as needed. Set `CHROMIUM_EXECUTABLE` to an installed Chromium
binary, or install Playwright's Chromium. The check exercises real js-dos disk
writes across Stop/Play, lazy loading, filters, pause, fullscreen, navigation
cleanup, failed downloads, retry and sticky Mac disk errors. It does not claim
to complete every game or validate every browser.

Generated files live in ignored `.arcade-runtime/`, downloads in
`.arcade-cache/`, and the pinned Infinite Mac checkout in `.arcade-tools/`.
Local rebuilds can retain obsolete hashed files. Build the release with the
Dockerfile's fresh output directory, not by copying a developer's output tree.
Source checksums must be reviewed when upstream bytes change; do not replace a
pin just to make the build pass.

## Source inventory

| Input | Pin and transformation |
| --- | --- |
| js-dos 8.4.1 and six DOS games | `sources.json`; `prepare.py` preserves original documentation, supplies DOSBox-X startup configuration, and makes SHA-256-checked 16 MiB chunks. |
| Space Cadet browser port | lrusso/3DPinballSpaceCadet revision `684f0b57d0cc93d5a29329f0b59d9996c54f1553`, pinned bytes in `sources.json`. Original port readme is in `public/arcade/credits/`. |
| Infinite Mac | revision `c41a27187117c3c2814570eddd155b8a0d061634`; reviewed npm lock is `infinite-mac-package-lock.json`. `prepare-mac.py` contains the complete static-hosting and embed changes. The runtime includes upstream LICENSE, README and the build patch script under `/credits/`. |
| System 7.5 | Imported from that Infinite Mac revision. `customize-mac.py` removes the startup Stickies window. Saved HD and Outside World are retained; unused libraries and systems are placeholders. |
| Four extracted Mac game disks | The committed `mac/*.hfv.gz` files below retain the original folders and resource forks. The build expands them without needing the extraction workstation. |
| MacCube Volumes 1 and 2 | `discs.json` pins the complete CD bytes; `prepare-discs.py` makes local 128 KiB chunks. Volume 1 opens `Games_Arcade`; Volume 2 opens `Games_2`, then `Adventure`. |
| GTA 2 / Windows 95 | `windows.json` pins the decoded community bundle and 829 disk files from the public DOS.Zone package. `prepare-windows.mjs` mirrors all ranges and changes the disk base URL to this runtime. Node fetch decodes the source's Brotli encoding before checksum validation. |

The Mac extraction used the estate's existing `mac-disc-search/build-arcade-disk.py`
HFS reader and `machfs`. Armor and Chrysanthemum came from the full folders on
[MacSilverWare](https://archive.org/details/macsilverware). TaskMaker and Swoop
were retained from the earlier arcade disk built during the discovery session:
TaskMaker from MacSilverWare, Swoop from
[Inside Mac Games 31](https://archive.org/details/IMG31Oct1995). These are
provenance references, not dependencies of the container build.

| Compressed input | Original folder | SHA-256 |
| --- | --- | --- |
| `mac/armor.hfv.gz` | Armor 1.1 | `377ef96a92ecf2bc21d5f9179fd1fb11590c3b0268234bb4a98906548d0affc7` |
| `mac/chrysanthemum.hfv.gz` | Chrysanthemum 1.01 | `4b79c832e80b9d3a25c23b79a9aa253062de5100c98238578fa9b45e709fe3f5` |
| `mac/swoop.hfv.gz` | Swoop 1.0.1 ƒ | `8c747c7b1887cfe2bd1931395a977e867eeb1b8d018694f7d1a9c2cf2f85f7ed` |
| `mac/taskmaker.hfv.gz` | TaskMaker2.0 Folder | `c3ec05c011c7e72124b2bcf1addbc0e836597cde0acf57f3dbc385942f88e2c8` |

Game pages credit the original creators and link to their source collections.
The emulator projects have their own licenses; hosting a game does not transfer
its authorship or ownership to this site.

## Operational details

- Keep `arcade-nginx.conf` on the runtime. Its CSP permits the WebAssembly
  loaders and framing by the blog. The blog keeps its stricter script policy.
- Arcade documents also send COOP/COEP, and omit Astro's ClientRouter so entering
  or leaving the arcade applies those headers through a full navigation. Keep
  processed JavaScript external; Astro otherwise inlines small bundles that
  the site's CSP correctly blocks.
- Do not attach Traefik's generic SAMEORIGIN/security-header chain to the
  runtime ingress. It would prevent the blog from embedding its own games.
- Browser storage belongs to the runtime origin and browser profile. Clearing
  that storage removes saves. Mac game disks start fresh; copy the game folder
  onto Saved HD before playing if saves matter. Cloud sync is not enabled.
  In classic Finder, click the Saved HD label: the disc icon has a transparent
  center that does not select it. GTA 2's Windows save persistence is unverified.
- DOSBox-X is intentional: the other bundled backend produced a rendering
  error during testing. X-Wing requires explicit parent folders in the ZIP;
  Hand of Fate requires the Sound Blaster driver files beside its executable.
- The js-dos optional keyboard-lock call is patched to catch its rejected
  promise in an iframe. The lock failure must not become a game failure.
- Large CDs download only after Play. The Windows disk and Mac CDs stream
  ranges from nginx. Do not enable an upstream media proxy as a fallback.
- Keep the committed Mac inputs, source manifests and dependency lock. Screenshots
  and logs in `.arcade-tools/` are local review evidence, not build inputs.

Tonka, The Sims and StarCraft remain future compatibility work. They are not
listed as playable. Physical joystick support, all mobile controls and complete
playthroughs have not been verified.
