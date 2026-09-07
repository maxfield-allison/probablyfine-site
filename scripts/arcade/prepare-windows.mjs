#!/usr/bin/env node
// Mirror the reviewed GTA 2 Windows disk. Fetch decodes upstream Brotli; pins
// cover the decoded bytes that nginx will serve. No visitor uses the source CDN.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root = fileURLToPath(new URL('../../', import.meta.url));
const lock = JSON.parse(await fs.readFile(new URL('./windows.json', import.meta.url)));
const cache = path.join(root, '.arcade-cache/gta2-disk');
const output = path.join(root, '.arcade-runtime/arcade/assets');
await fs.mkdir(cache, {recursive:true});
await fs.mkdir(path.join(output, 'gta2-disk'), {recursive:true});
const sha = data => createHash('sha256').update(data).digest('hex');
async function source(name, url, expected) {
  let data;
  const local = path.join(cache, name);
  try { data = await fs.readFile(local); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(url, {signal:AbortSignal.timeout(120000)});
    if (!response.ok) throw Error(`${name}: HTTP ${response.status}`);
    data = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(local, data);
  }
  if (sha(data) !== expected.sha256 || (expected.bytes !== undefined && data.length !== expected.bytes)) throw Error(`${name}: source checksum changed`);
  return data;
}
const queue = Object.entries(lock.files);
async function worker() {
  while (queue.length) {
    const [name, expected] = queue.shift();
    if (!/^(sockdrive\.metaj|preload\.raw|\d+\.raw)$/.test(name)) throw Error('Unexpected disk file name');
    const data = await source(name, `${lock.base}/${name}`, expected);
    await fs.writeFile(path.join(output, 'gta2-disk', name), data);
  }
}
await Promise.all(Array.from({length:4}, worker));
const meta = JSON.parse(await fs.readFile(path.join(cache, 'sockdrive.metaj')));
await fs.writeFile(path.join(output, 'gta2-disk/preload_ranges.metaj'), JSON.stringify(meta.preload_ranges));
const bundle = await source('upstream.jsdos', lock.bundle.url, lock.bundle);
await fs.writeFile(path.join(cache, 'upstream.jsdos'), bundle);
// Preserve the original configuration and readme, replacing only the disk URL.
execFileSync('python3', ['-c', `
from pathlib import Path
import zipfile,io,json,hashlib
root=Path(${JSON.stringify(root)})
cache=root/'.arcade-cache/gta2-disk'
out=root/'.arcade-runtime/arcade/assets/grand-theft-auto-2'
out.mkdir(exist_ok=True)
stream=io.BytesIO()
with zipfile.ZipFile(cache/'upstream.jsdos') as source, zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as target:
 for entry in source.infolist():
  data=source.read(entry.filename)
  if entry.filename=='.jsdos/dosbox.conf':
   data=data.replace(${JSON.stringify(lock.base)}.encode(),b'https://arcade.probablyfine.dev/arcade/assets/gta2-disk')
  target.writestr(entry,data)
data=stream.getvalue()
digest=hashlib.sha256(data).hexdigest()
name='000-'+digest[:12]+'.bin'
(out/name).write_bytes(data)
(out/'bundle.json').write_text(json.dumps({'bytes':len(data),'parts':[{'url':name,'bytes':len(data),'sha256':digest}]})+'\\n')
`]);
console.log(`GTA 2 prepared: ${Object.keys(lock.files).length} pinned disk files`);
