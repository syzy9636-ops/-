import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import vm from 'node:vm'

const sandbox = { Uint8Array, Uint32Array, DataView, TextEncoder, Blob }
vm.createContext(sandbox)
vm.runInContext(await readFile(new URL('../public/tools/seamless/zip.js', import.meta.url), 'utf8'), sandbox)
const Archive = sandbox.TextureArchive
const archive = new Archive()
await archive.add('石材_seamless.tga', new Blob([Uint8Array.of(0, 128, 255, 1, 2, 3)]))
await archive.add('石材_seamless.tga', new Blob(['duplicate']))
await archive.add('空文件.txt', new Blob([]))
await archive.add('批量处理错误报告.txt', new Blob(['测试：不支持的文件']))
assert.equal(archive.entries.length, 4)
assert.equal(archive.names.size, 4)
const limit = new Archive()
limit.bytes = 256 * 1024 * 1024
await assert.rejects(() => limit.add('too-large.tga', new Blob(['x'])), /256 MB/)
assert.equal(limit.entries.length, 0)
const output = new URL('../.preview-check/seamless-archive-fixture.zip', import.meta.url)
await mkdir(new URL('../.preview-check/', import.meta.url), { recursive: true })
await writeFile(output, new Uint8Array(await archive.finish().arrayBuffer()))
console.log(JSON.stringify({ passed: true, entries: 4, unicode: true, deduplication: true, sizeLimit: true, output: output.pathname }))
