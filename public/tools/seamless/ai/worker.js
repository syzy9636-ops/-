'use strict';
// Web adaptation: verified, cached model chunks; all image inference stays on device.
let lamaSession;
async function loadModel(base, report) {
 const response = await fetch(base+'model.json');
 if (!response.ok) throw Error('模型清单加载失败，请检查网络后重试');
 const manifest = await response.json();
 if (manifest.version!==1 || !Number.isSafeInteger(manifest.bytes) || manifest.bytes<=0 || manifest.bytes>300*1024*1024 || !Array.isArray(manifest.parts)) throw Error('模型清单格式不正确');
 let cache;
 try { cache = await caches.open('vfx-lama-'+manifest.sha256); } catch {}
 const model = new Uint8Array(manifest.bytes);
 let offset=0;
 for (const part of manifest.parts) {
  if (!/^lama-\d{2}\.bin$/.test(part.file) || !Number.isSafeInteger(part.bytes) || part.bytes<=0 || offset+part.bytes>model.length) throw Error('模型分片无效');
  const url = new URL(part.file,base).href;
  let cached;
  try { cached = await cache?.match(url); } catch {}
  const check = async bytes => {
   if(bytes.byteLength!==part.bytes)return false;
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
   return hash===part.sha256;
  };
  let bytes = cached ? new Uint8Array(await cached.arrayBuffer()) : null;
  if (!bytes || !await check(bytes)) {
   const downloaded = await fetch(url);
   if (!downloaded.ok) throw Error('模型下载中断，请检查网络后重试');
   bytes = new Uint8Array(await downloaded.arrayBuffer());
   if (!await check(bytes)) throw Error('模型分片校验失败，请重新加载');
   try { await cache?.put(url,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}})); } catch {}
  }
  model.set(bytes,offset); offset+=bytes.length;
  report(.04+.16*offset/model.length,`准备 AI 模型 ${Math.round(offset/model.length*100)}% · 首次约 210 MB`);
 }
 if(offset!==model.length)throw Error('模型分片不完整');
 return model;
}
async function modelSession(base,report){
 if(!lamaSession){report(.04,'准备 AI 模型 · 图片不会上传');importScripts(base+'ort.wasm.min.js');ort.env.wasm.numThreads=1;ort.env.wasm.wasmPaths=base;
 lamaSession=loadModel(base,report).then(model=>ort.InferenceSession.create(model,{executionProviders:['wasm'],graphOptimizationLevel:'all'})).catch(e=>{lamaSession=null;throw e})}
 return lamaSession;
}
self.onmessage=async e=>{try{
 const {image:im,mask,options={},base}=e.data,{width:w,height:h}=im,n=w*h,report=(progress,text)=>self.postMessage({progress,text});
 if(!mask||mask.length!==n)throw Error('修复区域与图片尺寸不一致。');
 let xs=new Uint8Array(w),ys=new Uint8Array(h),painted=0;
 for(let p=0;p<n;p++)if(mask[p]){xs[p%w]=1;ys[p/w|0]=1;painted++}
 if(!painted)throw Error('请先涂抹需要修复的位置。');if(painted>n*.8)throw Error('涂抹范围超过图片的 80%，请缩小范围或分区修复。');
 const wrapX=!!options.lock&&options.axes!=='y',wrapY=!!options.lock&&options.axes!=='x',mod=(v,m)=>(v%m+m)%m;
 function span(a,wrap){let first=a.indexOf(1),last=a.lastIndexOf(1);if(!wrap)return {start:first,size:last-first+1};let prev=-1,gap=0,start=first;for(let x=0;x<a.length;x++)if(a[x]){if(prev>=0&&x-prev-1>gap){gap=x-prev-1;start=x}prev=x}let seam=first+a.length-last-1;if(seam>gap){gap=seam;start=first}return {start,size:a.length-gap}}
 const sx=span(xs,wrapX),sy=span(ys,wrapY),side=Math.max(512,sx.size+160,sy.size+160);let left=Math.floor(sx.start+(sx.size-side)/2),top=Math.floor(sy.start+(sy.size-side)/2);
 if(!wrapX)left=w>=side?Math.max(0,Math.min(w-side,left)):Math.floor((w-side)/2);if(!wrapY)top=h>=side?Math.max(0,Math.min(h-side,top)):Math.floor((h-side)/2);
 const input=new Float32Array(3*512*512),hole=new Float32Array(512*512),area=512*512;
 const pixel=(x,y)=>{x=wrapX?mod(x,w):Math.max(0,Math.min(w-1,x));y=wrapY?mod(y,h):Math.max(0,Math.min(h-1,y));return y*w+x};
 // Sample only the local context. Original-resolution pixels outside the brush
 // are copied exactly back; transparent pixels retain their original alpha.
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){let gx=left+(x+.5)*side/512-.5,gy=top+(y+.5)*side/512-.5,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0,p=y*512+x;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){let q=pixel(x0+dx,y0+dy)*4,wt=(dx?fx:1-fx)*(dy?fy:1-fy),alpha=im.data[q+3]/255;for(let k=0;k<3;k++)input[k*area+p]+=(im.data[q+k]*alpha+128*(1-alpha))*wt/255;if(wt>0&&mask[q/4])hole[p]=1}}
 const local=(x,start,wrap,size)=>{if(!wrap)return x-start;let a=mod(x-start,size);return a+Math.max(0,Math.min(Math.floor((side-1-a)/size),Math.round((side/2-a)/size)))*size};
 for(let p=0;p<n;p++)if(mask[p]){let x=local(p%w,left,wrapX,w),y=local(p/w|0,top,wrapY,h);if(x>=side||y>=side||x<0||y<0)continue;let ax=Math.max(0,Math.floor(x*512/side)),ay=Math.max(0,Math.floor(y*512/side)),bx=Math.min(511,Math.ceil((x+1)*512/side)-1),by=Math.min(511,Math.ceil((y+1)*512/side)-1);for(let iy=ay;iy<=by;iy++)for(let ix=ax;ix<=bx;ix++)hole[iy*512+ix]=1}
 // One input-pixel margin excludes partially damaged edge samples.
 const expanded=new Float32Array(hole);for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(hole[y*512+x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let xx=x+dx,yy=y+dy;if(xx>=0&&xx<512&&yy>=0&&yy<512)expanded[yy*512+xx]=1}
 const session=await modelSession(base,report);report(.25,'AI 正在重建结构与纹理 · 可随时取消');
 const outputs=await session.run({image:new ort.Tensor('float32',input,[1,3,512,512]),mask:new ort.Tensor('float32',expanded,[1,1,512,512])}),result=outputs[session.outputNames[0]],data=result.data;
 report(.93,'恢复原图分辨率与透明通道');const out={width:w,height:h,data:new Uint8ClampedArray(im.data)};
 for(let p=0;p<n;p++)if(mask[p]){let x=local(p%w,left,wrapX,w),y=local(p/w|0,top,wrapY,h),gx=(x+.5)*512/side-.5,gy=(y+.5)*512/side-.5,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0,t=mask[p]/255;if(!im.data[p*4+3])continue;for(let k=0;k<3;k++){let value=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){let xx=Math.max(0,Math.min(511,x0+dx)),yy=Math.max(0,Math.min(511,y0+dy));value+=data[k*area+yy*512+xx]*(dx?fx:1-fx)*(dy?fy:1-fy)}let alpha=im.data[p*4+3]/255;value=Math.max(0,Math.min(255,(value-128*(1-alpha))/alpha));out.data[p*4+k]=im.data[p*4+k]*(1-t)+value*t}}
 for(let output of Object.values(outputs))output.dispose?.();report(1,'AI 修复完成');self.postMessage({result:out},[out.data.buffer]);
}catch(e){self.postMessage({error:e.message||String(e)})}};
