// Store-only ZIP writer: encoded textures do not benefit from recompressing on the UI thread.
(function(root){
'use strict';
const table=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0}
class TextureArchive{
 constructor(){this.entries=[];this.bytes=0;this.names=new Set()}
 async add(name,blob){
  if(this.bytes+blob.size>256*1024*1024)throw Error('下载包超过 256 MB。请分批导出，或选择保存文件夹后重试。');
  if(this.entries.length>=60000)throw Error('下载包文件过多，请分批导出。');
  const original=name;let count=1;
  while(this.names.has(name)){const dot=original.lastIndexOf('.');name=dot<0?original+' ('+count+++')':original.slice(0,dot)+' ('+count+++')'+original.slice(dot)}
  const encoded=new TextEncoder().encode(name),checksum=crc32(new Uint8Array(await blob.arrayBuffer()));
  this.entries.push({name:encoded,blob,crc:checksum});this.names.add(name);this.bytes+=blob.size;
 }
 finish(){
  const parts=[],central=[];let offset=0,centralBytes=0;
  const now=new Date(),date=((Math.max(1980,now.getFullYear())-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate(),time=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
  for(const e of this.entries){
   const header=new Uint8Array(30+e.name.length),v=new DataView(header.buffer);
   v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(10,time,true);v.setUint16(12,date,true);v.setUint32(14,e.crc,true);v.setUint32(18,e.blob.size,true);v.setUint32(22,e.blob.size,true);v.setUint16(26,e.name.length,true);header.set(e.name,30);
   const dir=new Uint8Array(46+e.name.length),d=new DataView(dir.buffer);
   d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(12,time,true);d.setUint16(14,date,true);d.setUint32(16,e.crc,true);d.setUint32(20,e.blob.size,true);d.setUint32(24,e.blob.size,true);d.setUint16(28,e.name.length,true);d.setUint32(42,offset,true);dir.set(e.name,46);
   parts.push(header,e.blob);central.push(dir);offset+=header.length+e.blob.size;centralBytes+=dir.length;
  }
  const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,this.entries.length,true);v.setUint16(10,this.entries.length,true);v.setUint32(12,centralBytes,true);v.setUint32(16,offset,true);
  return new Blob([...parts,...central,end],{type:'application/zip'});
 }
}
root.TextureArchive=TextureArchive;
})(typeof self!=='undefined'?self:globalThis);
