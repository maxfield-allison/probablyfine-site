// The one image pipeline the site uses for photographs, shared by the Immich
// puller and the local importer so there is exactly one place that decides how a
// photo is rotated, resized and — the part that matters — stripped.
//
// sharp discards all metadata unless withMetadata() is called, which is precisely
// what is wanted: phone cameras attach GPS coordinates to nearly every frame, and
// these are photos taken at home. .rotate() with no argument bakes in the EXIF
// orientation tag before the metadata goes away, so portrait shots do not come out
// sideways.
//
// What this cannot check is what is visible *in* the frame: house numbers, plates,
// screens showing internal addresses, faces of people who did not agree to be on a
// public site. That review is still yours.
import sharp from 'sharp';

// Long edge. 1600 matches src/content/posts/img, where photos run full column
// width. Gallery pages that only ever show a photo at a few hundred pixels pass
// something smaller. Astro resizes again at build time; this just keeps
// multi-megabyte originals out of git history.
export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 82;

/**
 * @param {Buffer} original
 * @param {{ maxEdge?: number, quality?: number }} [opts]
 */
export async function processPhoto(original, opts = {}) {
  const { maxEdge = MAX_EDGE, quality = JPEG_QUALITY } = opts;
  return sharp(original)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
}

/** True if the source carried GPS coordinates, so the strip can be reported honestly. */
export async function hadGps(original) {
  const { exif } = await sharp(original).metadata();
  if (!exif) return false;
  // 0x8825 is the GPS IFD pointer tag; the EXIF block can be either byte order.
  return exif.includes(Buffer.from([0x88, 0x25])) || exif.includes(Buffer.from([0x25, 0x88]));
}
