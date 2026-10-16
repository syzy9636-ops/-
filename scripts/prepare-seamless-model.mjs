import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'

const source = process.argv[2]
if (!source) throw new Error('Pass the Seamless-Studio vendor directory as the first argument.')
const target = resolve('public/tools/seamless/ai')
await mkdir(target, { recursive: true })
const model = await readFile(join(source, 'lama_fp32.onnx'))
const hash = data => createHash('sha256').update(data).digest('hex')
const expected = '1faef5301d78db7dda502fe59966957ec4b79dd64e16f03ed96913c7a4eb68d6'
if (hash(model) !== expected) throw new Error('Unexpected LaMa model checksum; verify the model before changing the expected checksum.')
const parts = []
// Each file stays below both GitHub's 100 MiB Git limit and 25 MiB browser upload limit.
const chunkSize = 16 * 1024 * 1024
for (let offset = 0; offset < model.length; offset += chunkSize) {
  const chunk = model.subarray(offset, Math.min(offset + chunkSize, model.length))
  const file = `lama-${String(parts.length + 1).padStart(2, '0')}.bin`
  await writeFile(join(target, file), chunk)
  parts.push({ file, bytes: chunk.length, sha256: hash(chunk) })
}
await writeFile(join(target, 'model.json'), JSON.stringify({ version: 1, bytes: model.length, sha256: expected, parts }, null, 2) + '\n')
for (const file of ['ort.wasm.min.js', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm', 'LaMa-LICENSE.txt', 'ORT-LICENSE.txt', 'ORT-NOTICES.txt']) {
  await copyFile(join(source, file), join(target, file))
}
console.log(`Prepared ${parts.length} model parts, ${model.length} bytes; checksum verified.`)
