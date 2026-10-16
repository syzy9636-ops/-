(function(root){
'use strict';
const checkSize=(w,h)=>{if(!w||!h||w>16384||h>16384||w*h>67108864)throw Error('图片尺寸超出范围：单边最大 16384，总像素最大 6400 万。')};
function encodeTGA(im){let a=new Uint8Array(18+im.data.length),v=new DataView(a.buffer);a[2]=2;v.setUint16(12,im.width,true);v.setUint16(14,im.height,true);a[16]=32;a[17]=0x28;for(let i=0;i<im.data.length;i+=4){a[18+i]=im.data[i+2];a[19+i]=im.data[i+1];a[20+i]=im.data[i];a[21+i]=im.data[i+3]}return a}
function decodeTGA(buffer){
 let a=new Uint8Array(buffer),v=new DataView(buffer);if(a.length<18)throw Error('TGA 文件不完整。');
 let type=a[2],w=v.getUint16(12,true),h=v.getUint16(14,true),bpp=a[16],channels=bpp/8;checkSize(w,h);
 if(a[1]||![2,3,10,11].includes(type)||!([24,32].includes(bpp)||([3,11].includes(type)&&bpp===8)))throw Error('支持 24/32 位真彩色、8 位灰度 TGA，含 RLE 压缩。');
 let out=new Uint8ClampedArray(w*h*4),p=18+a[0],pixel=0;
 const read=()=>{if(p+channels>a.length)throw Error('TGA 像素数据不完整。');let color=channels===1?[a[p],a[p],a[p],255]:[a[p+2],a[p+1],a[p],channels===4?a[p+3]:255];p+=channels;return color};
 const put=color=>{if(pixel>=w*h)throw Error('TGA 数据长度异常。');let x=pixel%w,y=Math.floor(pixel/w);if(!(a[17]&32))y=h-1-y;if(a[17]&16)x=w-1-x;out.set(color,(y*w+x)*4);pixel++};
 while(pixel<w*h){if(type>=10){if(p>=a.length)throw Error('TGA 数据不完整。');let n=a[p++],count=(n&127)+1;if(n&128){let color=read();for(let i=0;i<count;i++)put(color)}else for(let i=0;i<count;i++)put(read())}else put(read())}
 return {width:w,height:h,data:out};
}
function encodeBMP(im){let size=122+im.data.length,a=new Uint8Array(size),v=new DataView(a.buffer);a[0]=66;a[1]=77;v.setUint32(2,size,true);v.setUint32(10,122,true);v.setUint32(14,108,true);v.setInt32(18,im.width,true);v.setInt32(22,-im.height,true);v.setUint16(26,1,true);v.setUint16(28,32,true);v.setUint32(30,3,true);v.setUint32(34,im.data.length,true);v.setUint32(54,0x00ff0000,true);v.setUint32(58,0x0000ff00,true);v.setUint32(62,0x000000ff,true);v.setUint32(66,0xff000000,true);v.setUint32(70,0x73524742,true);for(let i=0;i<im.data.length;i+=4){a[122+i]=im.data[i+2];a[123+i]=im.data[i+1];a[124+i]=im.data[i];a[125+i]=im.data[i+3]}return a}
function decodeBMP(buffer){
 let v=new DataView(buffer);if(buffer.byteLength<54||v.getUint16(0,true)!==0x4d42)throw Error('BMP 文件头无效。');
 let off=v.getUint32(10,true),dib=v.getUint32(14,true),w=v.getInt32(18,true),rawH=v.getInt32(22,true),h=Math.abs(rawH),bits=v.getUint16(28,true),compression=v.getUint32(30,true);checkSize(w,h);
 if(![24,32].includes(bits)||![0,3].includes(compression))return null;
 let stride=Math.ceil(w*bits/32)*4;if(off+stride*h>buffer.byteLength)throw Error('BMP 像素数据不完整。');
 let masks=[0xff0000,0xff00,0xff,0];if(compression===3){if(dib<40||buffer.byteLength<66)throw Error('BMP 颜色掩码无效。');masks=[v.getUint32(54,true),v.getUint32(58,true),v.getUint32(62,true),dib>=56?v.getUint32(66,true):0]}
 const channel=(p,m,alpha=false)=>{if(!m)return alpha?255:0;let shift=0;while(((m>>>shift)&1)===0&&shift<31)shift++;let max=m>>>shift;return Math.round(((p&m)>>>shift)/max*255)};
 let d=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let p=off+(rawH<0?y:h-1-y)*stride+x*bits/8,q=(y*w+x)*4;if(bits===24){d[q]=v.getUint8(p+2);d[q+1]=v.getUint8(p+1);d[q+2]=v.getUint8(p);d[q+3]=255}else{let value=v.getUint32(p,true);for(let c=0;c<4;c++)d[q+c]=channel(value,masks[c],c===3)}}return {width:w,height:h,data:d};
}
function encodeTIFF(im){
 const count=12,ifd=8,bits=ifd+2+count*12+4,start=bits+8,a=new Uint8Array(start+im.data.length),v=new DataView(a.buffer);a[0]=a[1]=73;v.setUint16(2,42,true);v.setUint32(4,ifd,true);v.setUint16(ifd,count,true);
 const entries=[[256,4,1,im.width],[257,4,1,im.height],[258,3,4,bits],[259,3,1,1],[262,3,1,2],[273,4,1,start],[274,3,1,1],[277,3,1,4],[278,4,1,im.height],[279,4,1,im.data.length],[284,3,1,1],[338,3,1,2]];
 entries.forEach((e,i)=>{let p=ifd+2+i*12;v.setUint16(p,e[0],true);v.setUint16(p+2,e[1],true);v.setUint32(p+4,e[2],true);if(e[1]===3&&e[2]===1)v.setUint16(p+8,e[3],true);else v.setUint32(p+8,e[3],true)});for(let i=0;i<4;i++)v.setUint16(bits+i*2,8,true);a.set(im.data,start);return a;
}
function unpackBits(a,max){let out=new Uint8Array(max),p=0,q=0;while(p<a.length&&q<max){let n=a[p++];if(n<128){let count=n+1;if(p+count>a.length||q+count>max)throw Error('TIFF PackBits 数据异常。');out.set(a.subarray(p,p+count),q);p+=count;q+=count}else if(n>128){let count=257-n;if(p>=a.length||q+count>max)throw Error('TIFF PackBits 数据异常。');out.fill(a[p++],q,q+count);q+=count}}if(q!==max)throw Error('TIFF 数据不足。');return out}
function unpackLZW(a,max){
 let out=new Uint8Array(max),q=0,bit=0,bits=9,next=258,dict=[],prev=null;
 const reset=()=>{dict=Array.from({length:258},(_,i)=>new Uint8Array(i<256?[i]:[]));bits=9;next=258;prev=null};reset();
 while(bit+bits<=a.length*8){let code=0;for(let i=0;i<bits;i++){code=(code<<1)|((a[bit>>3]>>(7-(bit&7)))&1);bit++}if(code===257)break;if(code===256){reset();continue}let entry=dict[code];if(!entry&&code===next&&prev){entry=new Uint8Array(prev.length+1);entry.set(prev);entry[prev.length]=prev[0]}if(!entry)throw Error('TIFF LZW 编码无效。');if(q+entry.length>max)throw Error('TIFF 解压大小异常。');out.set(entry,q);q+=entry.length;if(prev&&next<4096){let n=new Uint8Array(prev.length+1);n.set(prev);n[prev.length]=entry[0];dict[next++]=n;if(next===(1<<bits)-1&&bits<12)bits++}prev=entry;if(q===max)break}if(q!==max)throw Error('TIFF LZW 数据不足。');return out;
}
async function decodeTIFF(buffer){
 let v=new DataView(buffer),a=new Uint8Array(buffer);if(a.length<8)throw Error('TIFF 文件不完整。');let le=a[0]===73;if(!((le&&a[1]===73)||(!le&&a[0]===77&&a[1]===77))||v.getUint16(2,le)!==42)throw Error('仅支持标准 TIFF，暂不支持 BigTIFF。');
 let offset=v.getUint32(4,le),count=v.getUint16(offset,le),tags={};if(count>4096)throw Error('TIFF 目录过大。');
 for(let i=0;i<count;i++){let p=offset+2+i*12,tag=v.getUint16(p,le),type=v.getUint16(p+2,le),n=v.getUint32(p+4,le),size=type===3?2:type===4?4:1;if(![1,3,4].includes(type))continue;if(n>1000000)throw Error('TIFF 标签长度异常。');let q=n*size<=4?p+8:v.getUint32(p+8,le);if(q+n*size>a.length)throw Error('TIFF 标签越界。');tags[tag]=Array.from({length:n},(_,j)=>size===1?a[q+j]:size===2?v.getUint16(q+j*2,le):v.getUint32(q+j*4,le))}
 const val=(id,fallback)=>tags[id]?.[0]??fallback;
 let w=val(256),h=val(257),spp=val(277,1),photo=val(262,1),comp=val(259,1),rows=val(278,h),orientation=val(274,1);checkSize(w,h);
 if(!tags[258]?.every(x=>x===8)||val(284,1)!==1||![1,4].includes(orientation)||![0,1,2,3].includes(photo)||![1,2,3,4].includes(spp)||!tags[273]||tags[322])throw Error('此 TIFF 需要转换为 8 位、条带存储的 RGB / RGBA / 灰度图后导入。暂不支持 16/32 位、CMYK、分块 TIFF。');
 if(photo===2&&spp<3)throw Error('TIFF RGB 通道不完整。');
 let raw=new Uint8Array(w*h*spp),dest=0;
 for(let i=0;i<tags[273].length;i++){
  let pos=tags[273][i],size=tags[279]?.[i],needed=Math.min(rows,h-i*rows)*w*spp;if(needed<=0)break;if(!size||pos+size>a.length)throw Error('TIFF 条带无效。');let part=a.slice(pos,pos+size),decoded;
  if(comp===1)decoded=part;else if(comp===32773)decoded=unpackBits(part,needed);else if(comp===5)decoded=unpackLZW(part,needed);else if([8,32946].includes(comp)){decoded=new Uint8Array(await new Response(new Blob([part]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer())}else throw Error('暂不支持此 TIFF 压缩方式，请使用无压缩、LZW、Deflate 或 PackBits。');
  if(decoded.length<needed)throw Error('TIFF 像素数据不足。');raw.set(decoded.subarray(0,needed),dest);dest+=needed;
 }
 if(dest!==raw.length)throw Error('TIFF 缺少像素条带。');
 if(val(317,1)===2)for(let y=0;y<h;y++)for(let x=spp;x<w*spp;x++)raw[y*w*spp+x]=(raw[y*w*spp+x]+raw[y*w*spp+x-spp])&255;
 else if(val(317,1)!==1)throw Error('暂不支持此 TIFF 预测器。');
 let d=new Uint8ClampedArray(w*h*4),palette=tags[320];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let p=(y*w+x)*spp,q=((orientation===4?h-1-y:y)*w+x)*4;
  if(photo===2){d[q]=raw[p];d[q+1]=raw[p+1];d[q+2]=raw[p+2];d[q+3]=spp===4?raw[p+3]:255}
  else if(photo===3){if(!palette||palette.length!==768)throw Error('TIFF 调色板无效。');for(let c=0;c<3;c++)d[q+c]=palette[c*256+raw[p]]/257;d[q+3]=255}
  else{let gray=photo===0?255-raw[p]:raw[p];d[q]=d[q+1]=d[q+2]=gray;d[q+3]=spp===2?raw[p+1]:255}
  if(val(338,2)===1&&d[q+3]>0)for(let c=0;c<3;c++)d[q+c]=d[q+c]*255/d[q+3];
 }return {width:w,height:h,data:d};
}
const api={encodeTGA,decodeTGA,encodeBMP,decodeBMP,encodeTIFF,decodeTIFF,checkSize};root.TextureCodecs=api;if(typeof module!=='undefined')module.exports=api;
})(typeof self!=='undefined'?self:globalThis);
