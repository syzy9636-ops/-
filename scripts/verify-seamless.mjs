import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import vm from 'node:vm'

const root = new URL('../public/tools/seamless/', import.meta.url)
const sandbox = { Uint8Array, Uint8ClampedArray, Uint32Array, Float32Array, Float64Array, ArrayBuffer, DataView, Blob, Response, DecompressionStream }
vm.createContext(sandbox)
for (const name of ['core.js', 'codecs.js']) vm.runInContext(await readFile(new URL(name, root), 'utf8'), sandbox)
const core = sandbox.TextureCore, codecs = sandbox.TextureCodecs
let checks=0
const same=(a,b)=>{assert.deepEqual(Array.from(a),Array.from(b));checks++}
const im=core.image(96,64)
for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)im.data.set([(x*17+y*3)%256,(x*5+y*11)%256,(x*7+y*23)%256,[0,128,255][x%3]],(y*im.width+x)*4)
const original = new Uint8ClampedArray(im.data)
for(const method of ['match','blend'])for(const axes of ['x','y','both']) {
 const out=core.seamless(im,{method,axes,band:.2,feather:.35})
 assert.equal(out.width,im.width);assert.equal(out.height,im.height)
 if(axes!=='y')for(let y=0;y<im.height;y++)same(out.data.subarray(y*im.width*4,y*im.width*4+4),out.data.subarray((y*im.width+im.width-1)*4,(y*im.width+im.width)*4))
 if(axes!=='x')for(let x=0;x<im.width;x++)same(out.data.subarray(x*4,x*4+4),out.data.subarray(((im.height-1)*im.width+x)*4,((im.height-1)*im.width+x)*4+4))
 same(im.data,original)
}
for(const format of ['TGA','BMP','TIFF']) {
 const encoded=codecs['encode'+format](im)
 const decoded=await codecs['decode'+format](encoded.buffer.slice(encoded.byteOffset,encoded.byteOffset+encoded.byteLength))
 assert.equal(decoded.width,im.width);assert.equal(decoded.height,im.height);same(decoded.data,im.data)
}
for(const method of ['nearest','lanczos']) {
 const scaled=core.resample(im,32,32,method)
 assert.equal(scaled.data.length,32*32*4);checks++
 core.lockEdges(scaled);assert.equal(core.edgeError(scaled),0);checks++
}
const flat=core.image(64,64), mask=new Uint8Array(64*64)
for(let p=0;p<64*64;p++)flat.data.set([80,120,150,255],p*4)
for(let y=28;y<36;y++)for(let x=28;x<36;x++){const p=y*64+x;mask[p]=255;flat.data.set([220,25,35,255],p*4)}
const healed=core.heal(flat,mask,{})
let changed=0
for(let p=0;p<64*64;p++)if(!mask[p])same(healed.data.subarray(p*4,p*4+4),flat.data.subarray(p*4,p*4+4));else if(healed.data[p*4]!==flat.data[p*4])changed++
assert(changed>0);checks++
assert.throws(()=>core.heal(flat,new Uint8Array(64*64).fill(255),{}));checks++
const manifest=JSON.parse(await readFile(new URL('ai/model.json',root),'utf8')), joined=createHash('sha256')
let bytes=0
for(const part of manifest.parts){const data=await readFile(new URL('ai/'+part.file,root));assert.equal(data.length,part.bytes);assert(data.length<25*1024*1024);assert.equal(createHash('sha256').update(data).digest('hex'),part.sha256);joined.update(data);bytes+=data.length;checks++}
assert.equal(bytes,manifest.bytes);assert.equal(joined.digest('hex'),manifest.sha256);checks++
// Deterministic image for browser import, brush, alpha, and downloaded-file checks.
const fixture=core.image(128,128)
for(let y=0;y<128;y++)for(let x=0;x<128;x++){
 const alpha=x<16?0:x<48?128:255
 fixture.data.set([80+Math.round(20*Math.sin(x*.14)),120+Math.round(20*Math.sin(y*.12)),160,alpha],(y*128+x)*4)
}
for(let y=52;y<68;y++)for(let x=52;x<68;x++)fixture.data.set([240,20,30,255],(y*128+x)*4)
await mkdir(new URL('../.preview-check/',import.meta.url),{recursive:true})
await writeFile(new URL('../.preview-check/seamless-fixture.tga',import.meta.url),codecs.encodeTGA(fixture))
const report={passed:true,checks,seamMethods:2,axes:3,losslessFormats:['TGA','BMP','TIFF'],textureRepair:true,modelParts:manifest.parts.length,modelBytes:bytes}
await writeFile(new URL('../.preview-check/seamless-core-results.json',import.meta.url),JSON.stringify(report,null,2))
console.log(JSON.stringify(report))
