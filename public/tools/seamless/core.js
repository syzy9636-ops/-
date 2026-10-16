/* Offline texture operations. RGBA data always uses straight alpha at the API boundary. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=(n,m)=>(n%m+m)%m;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
function image(w,h,data){return {width:w,height:h,data:data||new Uint8ClampedArray(w*h*4)}}
function copy(im){return image(im.width,im.height,new Uint8ClampedArray(im.data))}
function rect(im,r){let out=image(r.w,r.h);for(let y=0;y<r.h;y++)out.data.set(im.data.subarray(((r.y+y)*im.width+r.x)*4,((r.y+y)*im.width+r.x+r.w)*4),y*r.w*4);return out}
function mixPixel(dst,di,a,ai,b,bi,t){
 const aa=a[ai+3]/255,ba=b[bi+3]/255,alpha=aa*(1-t)+ba*t;
 for(let c=0;c<3;c++)dst[di+c]=alpha>1e-8?(a[ai+c]*aa*(1-t)+b[bi+c]*ba*t)/alpha:0;
 dst[di+3]=alpha*255;
}
function resample(im,w,h,method='lanczos',progress=()=>{}){
 if(w===im.width&&h===im.height)return copy(im);
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>67108864||w>16384||h>16384)throw Error('输出尺寸须为 1–16384 像素，总像素不超过 6400 万。');
 const out=image(w,h),src=im.data;
 if(method==='nearest'){
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let s=(Math.min(im.height-1,Math.floor((y+.5)*im.height/h))*im.width+Math.min(im.width-1,Math.floor((x+.5)*im.width/w)))*4;out.data.set(src.subarray(s,s+4),(y*w+x)*4)}return out;
 }
 const sinc=x=>Math.abs(x)<1e-8?1:Math.sin(Math.PI*x)/(Math.PI*x);
 const kernels=(a,b)=>{let scale=Math.max(1,a/b),support=3*scale;return Array.from({length:b},(_,i)=>{let center=(i+.5)*a/b-.5,start=Math.ceil(center-support),end=Math.floor(center+support),weights=[],indices=[],sum=0;for(let k=start;k<=end;k++){let z=(center-k)/scale,weight=sinc(z)*sinc(z/3);if(Math.abs(z)>=3)weight=0;weights.push(weight);indices.push(clamp(k,0,a-1));sum+=weight}return {indices,weights:weights.map(v=>v/sum)}})};
 const kx=kernels(im.width,w),ky=kernels(im.height,h),tmp=new Float32Array(w*im.height*4);
 for(let y=0;y<im.height;y++){for(let x=0;x<w;x++){let di=(y*w+x)*4,k=kx[x];for(let j=0;j<k.indices.length;j++){let si=(y*im.width+k.indices[j])*4,a=src[si+3]/255,wt=k.weights[j];for(let c=0;c<3;c++)tmp[di+c]+=src[si+c]*a*wt;tmp[di+3]+=a*wt}}if(y%128===0)progress(.5*y/im.height)}
 for(let y=0;y<h;y++){for(let x=0;x<w;x++){let di=(y*w+x)*4,k=ky[y],r=0,g=0,b=0,a=0;for(let j=0;j<k.indices.length;j++){let si=(k.indices[j]*w+x)*4,wt=k.weights[j];r+=tmp[si]*wt;g+=tmp[si+1]*wt;b+=tmp[si+2]*wt;a+=tmp[si+3]*wt}out.data[di]=a>1e-7?r/a:0;out.data[di+1]=a>1e-7?g/a:0;out.data[di+2]=a>1e-7?b/a:0;out.data[di+3]=clamp(a,0,1)*255}if(y%128===0)progress(.5+.5*y/h)}
 return out;
}
// Find a low-error path through opposite edge strips, then feather only near the path.
function stitchAxis(im,vertical,ratio,feather,method){
 let len=vertical?im.height:im.width,rows=vertical?im.width:im.height;
 if(len<8)return copy(im);
 let overlap=clamp(Math.round(len*ratio),3,Math.floor(len*.45)),n=len-overlap,src=im.data;
 const idx=(x,y)=>vertical?(x*im.width+y)*4:(y*im.width+x)*4;
 let seam=new Int32Array(rows);seam.fill(Math.floor(overlap/2));
 if(method==='match'){
  let prev=new Float64Array(overlap),curr=new Float64Array(overlap),back=new Int8Array(rows*overlap);
  for(let y=0;y<rows;y++){
   for(let x=0;x<overlap;x++){
    let a=idx(x,y),b=idx(n+x,y),aa=src[a+3]/255,ba=src[b+3]/255,cost=0;
    for(let c=0;c<3;c++)cost+=(src[a+c]*aa-src[b+c]*ba)**2;
    cost+=(src[a+3]-src[b+3])**2*2;
    cost+=100*((x-overlap/2)/(overlap/2))**2;
    if(x===0||x===overlap-1)cost+=1e7;
    let best=x;if(x>0&&prev[x-1]<prev[best])best=x-1;if(x+1<overlap&&prev[x+1]<prev[best])best=x+1;
    curr[x]=cost+(y?prev[best]:0);back[y*overlap+x]=best-x;
   }[prev,curr]=[curr,prev];
  }
  let x=1;for(let i=2;i<overlap-1;i++)if(prev[i]<prev[x])x=i;
  for(let y=rows-1;y>=0;y--){seam[y]=x;x+=back[y*overlap+x]}
 }
 let out=image(vertical?im.width:n,vertical?n:im.height),blend=Math.max(2,overlap*feather);
 for(let y=0;y<rows;y++)for(let x=0;x<n;x++){
  let di=vertical?(x*out.width+y)*4:(y*out.width+x)*4;
  if(x<overlap){let t=method==='blend'?smooth(x/(overlap-1)):smooth((x-seam[y])/blend+.5);if(x===0)t=0;if(x===overlap-1)t=1;mixPixel(out.data,di,src,idx(n+x,y),src,idx(x,y),t)}
  else out.data.set(src.subarray(idx(x,y),idx(x,y)+4),di);
 }
 // Preserve the requested document dimensions after removing the redundant overlap.
 return resample(out,im.width,im.height,'lanczos');
}
function lockEdges(im,axes='both'){
 const {width:w,height:h,data:d}=im,temp=new Uint8ClampedArray(4);
 // Identical endpoint pixels also keep exported mip levels from revealing a hard edge.
 if(axes!=='y'&&w>1)for(let y=0;y<h;y++){let a=y*w*4,b=(y*w+w-1)*4;mixPixel(temp,0,d,a,d,b,.5);d.set(temp,a);d.set(temp,b)}
 if(axes!=='x'&&h>1)for(let x=0;x<w;x++){let a=x*4,b=((h-1)*w+x)*4;mixPixel(temp,0,d,a,d,b,.5);d.set(temp,a);d.set(temp,b)}
 return im;
}
function seamless(im,opts={},progress=()=>{}){
 let out=copy(im),axes=opts.axes||'both',ratio=opts.band||.2,feather=opts.feather||.35;
 if(axes!=='y'){progress(.05,'匹配左右边缘纹理');out=stitchAxis(out,false,ratio,feather,opts.method||'match')}
 if(axes!=='x'){progress(.48,'匹配上下边缘纹理');out=stitchAxis(out,true,ratio,feather,opts.method||'match')}
 progress(.95,'校正四周接缝');return lockEdges(out,axes);
}
function applyMasked(base,candidate,mask){let out=copy(base);for(let i=0;i<mask.length;i++)if(mask[i])mixPixel(out.data,i*4,base.data,i*4,candidate.data,i*4,mask[i]/255);return out}
// Independent implementation inspired by Barnes et al. (2009) and Newson et al.
// (IPOL 2017, 189): conservative mask pyramid, coherent patch search, and a
// sharp final reconstruction. No external implementation or model is bundled.
function heal(im,mask,opts={},progress=()=>{}){
 const w=im.width,h=im.height,n=w*h;
 if(!mask||mask.length!==n)throw Error('修复区域与图片尺寸不一致。');
 // Large documents use a bounded local donor window to avoid allocating several
 // full-resolution feature maps for a small brush stroke.
 if(n>2097152&&!opts.localWindow){
  let minX=w,maxX=-1,minY=h,maxY=-1;for(let p=0;p<n;p++)if(mask[p]){let x=p%w,y=p/w|0;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
  if(maxX<0)throw Error('请先用修复笔刷涂抹需要修正的区域。');
  const wrapX=!!opts.lock&&opts.axes!=='y',wrapY=!!opts.lock&&opts.axes!=='x';
  function bounds(size,horizontal,wrap,first,last){if(!wrap)return {start:first,len:last-first+1};let used=new Uint8Array(size);for(let p=0;p<n;p++)if(mask[p])used[horizontal?p%w:p/w|0]=1;let prev=-1,gap=0,start=first;for(let x=0;x<size;x++)if(used[x]){if(prev>=0&&x-prev-1>gap){gap=x-prev-1;start=x}prev=x}let end=first+size-last-1;if(end>gap){gap=end;start=first}return {start,len:size-gap}}
  let bx=bounds(w,true,wrapX,minX,maxX),by=bounds(h,false,wrapY,minY,maxY);
  if(bx.len>1152||by.len>1152)throw Error('这次涂抹跨度较大，请改用 AI 结构修复，或分区使用纹理修复。');
  let cw=Math.min(w,bx.len+384),ch=Math.min(h,by.len+384),left=bx.start-Math.floor((cw-bx.len)/2),top=by.start-Math.floor((ch-by.len)/2);if(!wrapX)left=clamp(left,0,w-cw);if(!wrapY)top=clamp(top,0,h-ch);
  let crop=image(cw,ch),m=new Uint8Array(cw*ch);for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){let p=mod(top+y,h)*w+mod(left+x,w),q=y*cw+x;crop.data.set(im.data.subarray(p*4,p*4+4),q*4);m[q]=mask[p]}
  let result=heal(crop,m,{localWindow:true},progress),out=copy(im);for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){let q=y*cw+x;if(m[q]){let p=mod(top+y,h)*w+mod(left+x,w);out.data.set(result.data.subarray(q*4,q*4+4),p*4)}}if(opts.lock)lockEdges(out,opts.axes||'both');return out;
 }

 let holes=new Uint8Array(n),painted=0;
 for(let p=0;p<n;p++)if(mask[p]){holes[p]=1;painted++}
 if(!painted)throw Error('请先用修复笔刷涂抹需要修正的区域。');
 if(painted>n*.8)throw Error('涂抹范围超过图片的 80%，可参考的纹理不足。请擦除一部分或分区修复。');
 if(Math.min(w,h)<7)throw Error('图片尺寸过小，修复需要至少 7×7 像素的参考纹理。');
 const wrapX=!!opts.lock&&opts.axes!=='y',wrapY=!!opts.lock&&opts.axes!=='x';
 // Distance to known pixels determines pyramid depth, independently of brush size.
 let distance=new Uint16Array(n),queue=new Int32Array(painted),head=0,tail=0,maxDistance=1;
 const near=(p,x,y,visit)=>{if(x>0)visit(p-1);else if(wrapX)visit(p+w-1);if(x+1<w)visit(p+1);else if(wrapX)visit(p-w+1);if(y>0)visit(p-w);else if(wrapY)visit(p+(h-1)*w);if(y+1<h)visit(p+w);else if(wrapY)visit(p-(h-1)*w)};
 for(let p=0;p<n;p++)if(holes[p]){let boundary=false;near(p,p%w,(p/w)|0,q=>{if(!holes[q])boundary=true});if(boundary){distance[p]=1;queue[tail++]=p}}
 while(head<tail){let p=queue[head++],d=distance[p]+1;near(p,p%w,(p/w)|0,q=>{if(holes[q]&&!distance[q]){distance[q]=d;maxDistance=Math.max(maxDistance,d);queue[tail++]=q}})}
 const levels=[{im,mask:holes}];
 while(maxDistance>3&&levels.length<6){let last=levels[levels.length-1],a=last.im;if(Math.min(a.width,a.height)<48)break;let nw=Math.ceil(a.width/2),nh=Math.ceil(a.height/2),small=image(nw,nh),m=new Uint8Array(nw*nh);
  for(let y=0;y<nh;y++)for(let x=0;x<nw;x++){let d=(y*nw+x)*4,aa=0,rr=0,gg=0,bb=0,count=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){let sx=x*2+dx,sy=y*2+dy;if(sx>=a.width||sy>=a.height)continue;let q=sy*a.width+sx,k=q*4,alpha=a.data[k+3]/255;rr+=a.data[k]*alpha;gg+=a.data[k+1]*alpha;bb+=a.data[k+2]*alpha;aa+=alpha;count++;if(last.mask[q])m[y*nw+x]=1}small.data[d]=aa?rr/aa:0;small.data[d+1]=aa?gg/aa:0;small.data[d+2]=aa?bb/aa:0;small.data[d+3]=aa/count*255}
  levels.push({im:small,mask:m});maxDistance=Math.ceil(maxDistance/2);
 }
 // Texture statistics are carried separately, never recomputed from averaged fills.
 levels[0].texture=healTexture(im,holes,Math.min(12,Math.max(2,2**(levels.length-2))));
 for(let l=1;l<levels.length;l++){let a=levels[l],b=levels[l-1];a.texture=new Float32Array(a.im.width*a.im.height*2);for(let y=0;y<a.im.height;y++)for(let x=0;x<a.im.width;x++){let q=(Math.min(b.im.height-1,y*2)*b.im.width+Math.min(b.im.width-1,x*2))*2,p=(y*a.im.width+x)*2;a.texture[p]=b.texture[q];a.texture[p+1]=b.texture[q+1]}}
 let parent=null;
 for(let l=levels.length-1;l>=0;l--){progress((levels.length-1-l)/levels.length,'分析纹理走势 · '+(levels.length-l)+' / '+levels.length);parent=healLevel(levels[l].im,levels[l].mask,levels[l].texture,parent,{wrapX,wrapY,finest:l===0},v=>progress((levels.length-1-l+v)/levels.length,l?'匹配整体结构':'恢复粒子与纹理细节'))}
 let out=applyMasked(im,parent.im,mask);
 if(opts.lock)lockEdges(out,opts.axes||'both');progress(1,'修复完成');return out;
}
function healTexture(im,mask,r){
 const w=im.width,h=im.height,stride=w+1,ix=new Float64Array((w+1)*(h+1)),iy=new Float64Array(ix.length),count=new Int32Array(ix.length),out=new Float32Array(w*h*2);
 const lum=p=>{let i=p*4,a=im.data[i+3]/255;return (im.data[i]*.2126+im.data[i+1]*.7152+im.data[i+2]*.0722)*a};
 for(let y=0;y<h;y++){let sx=0,sy=0,n=0;for(let x=0;x<w;x++){let p=y*w+x;if(x>0&&x<w-1&&y>0&&y<h-1&&!mask[p]&&!mask[p-1]&&!mask[p+1]&&!mask[p-w]&&!mask[p+w]){sx+=Math.abs(lum(p+1)-lum(p-1))/2;sy+=Math.abs(lum(p+w)-lum(p-w))/2;n++}let q=(y+1)*stride+x+1;ix[q]=ix[q-stride]+sx;iy[q]=iy[q-stride]+sy;count[q]=count[q-stride]+n}}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let x0=Math.max(0,x-r),y0=Math.max(0,y-r),x1=Math.min(w,x+r+1),y1=Math.min(h,y+r+1),a=y1*stride+x1,b=y0*stride+x1,c=y1*stride+x0,d=y0*stride+x0,n=count[a]-count[b]-count[c]+count[d],p=(y*w+x)*2;if(n){out[p]=(ix[a]-ix[b]-ix[c]+ix[d])/n;out[p+1]=(iy[a]-iy[b]-iy[c]+iy[d])/n}}return out;
}
function healLevel(src,mask,texture,parent,opts,progress){
 const w=src.width,h=src.height,n=w*h;
 let radius=Math.min(3,Math.floor((Math.min(w,h)-1)/2)),valid,donors;
 // Every pixel in a donor patch must be original, unpainted data.
 const integral=new Int32Array((w+1)*(h+1)),stride=w+1;
 for(let y=0;y<h;y++){let s=0;for(let x=0;x<w;x++){s+=mask[y*w+x];integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+s}}
 do{valid=new Uint8Array(n);donors=[];for(let y=radius;y<h-radius;y++)for(let x=radius;x<w-radius;x++){let x0=x-radius,y0=y-radius,x1=x+radius+1,y1=y+radius+1;if(integral[y1*stride+x1]-integral[y0*stride+x1]-integral[y1*stride+x0]+integral[y0*stride+x0]===0){valid[y*w+x]=1;donors.push(y*w+x)}}if(donors.length)break;radius--}while(radius>=1);
 if(!donors.length)throw Error('完整参考纹理不足，请缩小涂抹范围或分区修复。');
 const coord=(x,y)=>{if(opts.wrapX)x=mod(x,w);else if(x<0||x>=w)return -1;if(opts.wrapY)y=mod(y,h);else if(y<0||y>=h)return -1;return y*w+x};
 const active=new Uint8Array(n),pixels=[],centers=[];
 for(let p=0;p<n;p++)if(mask[p]){pixels.push(p);let x=p%w,y=(p/w)|0;for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){let q=coord(x+dx,y+dy);if(q>=0)active[q]=1}}
 for(let p=0;p<n;p++)if(active[p])centers.push(p);
 let work=copy(src),workTexture=new Float32Array(texture);
 if(parent){let up=resample(parent.im,w,h,'nearest');for(let p of pixels)work.data.set(up.data.subarray(p*4,p*4+4),p*4)}
 else{
  // Known-pixel propagation initializes holes without ever reading damaged colors.
  let known=new Uint8Array(n),q=new Int32Array(n),tail=0,head=0;for(let p=0;p<n;p++)if(!mask[p]){known[p]=1;q[tail++]=p}
  while(head<tail){let p=q[head++],x=p%w,y=(p/w)|0;for(let [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){let t=coord(x+dx,y+dy);if(t>=0&&!known[t]){known[t]=1;work.data.set(work.data.subarray(p*4,p*4+4),t*4);workTexture[t*2]=workTexture[p*2];workTexture[t*2+1]=workTexture[p*2+1];q[tail++]=t}}}
 }
 const pw=w+radius*2,ph=h+radius*2,channels=6,offsets=[];
 for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)offsets.push((dy*pw+dx)*channels);
 const paddedMask=new Uint8Array(pw*ph);
 for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){let q=coord(x-radius,y-radius);paddedMask[y*pw+x]=q>=0?mask[q]:2}
 function features(im,tex){let f=new Float32Array(pw*ph*channels);
  for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){let sx=opts.wrapX?mod(x-radius,w):clamp(x-radius,0,w-1),sy=opts.wrapY?mod(y-radius,h):clamp(y-radius,0,h-1),q=sy*w+sx,k=q*4,p=y*pw+x,i=p*channels,a=im.data[k+3]/255;f[i]=im.data[k]*a;f[i+1]=im.data[k+1]*a;f[i+2]=im.data[k+2]*a;f[i+3]=im.data[k+3];f[i+4]=tex[q*2];f[i+5]=tex[q*2+1]}return f;
 }
 const source=features(src,texture),mx=new Int32Array(n),my=new Int32Array(n),cost=new Float32Array(n),norm=new Float32Array(n);mx.fill(-1);
 let target=features(work,workTexture),seed=931+7919*w+h;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 let holeWeight=0;
 function distance(p,sx,sy,bound){let x=p%w,y=(p/w)|0,a=((y+radius)*pw+x+radius)*channels,b=((sy+radius)*pw+sx+radius)*channels,sum=0;
  for(let off of offsets){let t=a+off,k=b+off,m=paddedMask[t/channels];if(m===2)continue;let wt=m?holeWeight:1;if(!wt)continue;let d0=target[t]-source[k],d1=target[t+1]-source[k+1],d2=target[t+2]-source[k+2],da=target[t+3]-source[k+3],gx=target[t+4]-source[k+4],gy=target[t+5]-source[k+5];sum+=wt*(d0*d0+d1*d1+d2*d2+2*da*da+50*(gx*gx+gy*gy));if(sum>bound)return sum}return sum;
 }
 function prepare(){for(let p of centers){let a=(((p/w|0)+radius)*pw+p%w+radius),s=0;for(let off of offsets){let m=paddedMask[a+off/channels];if(m!==2)s+=m?holeWeight:1}norm[p]=Math.max(s,1);cost[p]=mx[p]>=0?distance(p,mx[p],my[p],Infinity):Infinity}}
 function consider(p,x,y){x=Math.round(x);y=Math.round(y);if(x<radius||x>=w-radius||y<radius||y>=h-radius||!valid[y*w+x])return;let d=distance(p,x,y,cost[p]);if(d<cost[p]){cost[p]=d;mx[p]=x;my[p]=y}}
 prepare();
 for(let p of centers){let x=p%w,y=p/w|0;if(parent){let px=Math.min(parent.im.width-1,x>>1),py=Math.min(parent.im.height-1,y>>1),pp=py*parent.im.width+px;if(parent.mx[pp]>=0){let sx=x+2*(parent.mx[pp]-px),sy=y+2*(parent.my[pp]-py);consider(p,sx,sy);if(mx[p]<0)for(let trial=0;trial<16;trial++)consider(p,sx+(random()-.5)*12,sy+(random()-.5)*12)}}
  for(let i=0;i<(parent?8:64);i++){let q=donors[Math.floor(random()*donors.length)];consider(p,q%w,q/w|0)}
 }
 function reconstruct(sharp){
  const next=copy(work),nextTexture=new Float32Array(workTexture),sorted=centers.map(p=>cost[p]/norm[p]).sort((a,b)=>a-b),sigma=Math.max(1,sorted[Math.floor(sorted.length*.75)]);
  for(let p of pixels){let x=p%w,y=p/w|0,sum=0,rr=0,gg=0,bb=0,aa=0,tx=0,ty=0,best=Infinity,bestSource=-1;
   for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){let q=coord(x+dx,y+dy);if(q<0||mx[q]<0)continue;let sx=mx[q]-dx,sy=my[q]-dy;if(sx<0||sx>=w||sy<0||sy>=h)continue;let sp=sy*w+sx,s=sp*4,d=cost[q]/norm[q],spatial=1-.25*(dx*dx+dy*dy)/(2*radius*radius),score=(d+1)/spatial;
    if(score<best){best=score;bestSource=s}if(!sharp){let wt=spatial*Math.exp(-Math.min(80,d/(2*sigma))),a=src.data[s+3]/255;rr+=src.data[s]*a*wt;gg+=src.data[s+1]*a*wt;bb+=src.data[s+2]*a*wt;aa+=a*wt;tx+=texture[sp*2]*wt;ty+=texture[sp*2+1]*wt;sum+=wt}
   }
   if(sharp&&bestSource>=0)next.data.set(src.data.subarray(bestSource,bestSource+4),p*4);
   else if(sum){next.data[p*4]=aa?rr/aa:0;next.data[p*4+1]=aa?gg/aa:0;next.data[p*4+2]=aa?bb/aa:0;next.data[p*4+3]=aa/sum*255;nextTexture[p*2]=tx/sum;nextTexture[p*2+1]=ty/sum}
  }
  work=next;workTexture=nextTexture;
 }
 // Reconstruct from upsampled correspondences, not enlarged coarse RGB values.
 if(parent){reconstruct(false);holeWeight=1;target=features(work,workTexture);prepare()}
 const rounds=opts.finest?6:8;
 for(let round=0;round<rounds;round++){
  if(round){holeWeight=1;target=features(work,workTexture);prepare()}
  for(let sweep=0;sweep<4;sweep++){
   const reverse=!!(sweep%2),dir=reverse?-1:1;
   for(let j=0;j<centers.length;j++){let p=centers[reverse?centers.length-1-j:j],x=p%w,y=p/w|0;
    for(let [dx,dy] of [[-dir,0],[0,-dir]]){let q=coord(x+dx,y+dy);if(q>=0&&mx[q]>=0)consider(p,mx[q]-dx,my[q]-dy)}
    let q=donors[Math.floor(random()*donors.length)];consider(p,q%w,q/w|0);
    for(let size=Math.max(w,h);size>=1;size=Math.floor(size/2)){let sx=mx[p]+(random()*2-1)*size,sy=my[p]+(random()*2-1)*size;consider(p,sx,sy)}
   }
  }
  reconstruct(opts.finest&&round===rounds-1);progress((round+1)/rounds);
 }
 return {im:work,mx,my};
}
function edgeError(im){let d=im.data,w=im.width,h=im.height,sum=0,n=0;for(let y=0;y<h;y++)for(let c=0;c<4;c++){sum+=Math.abs(d[(y*w)*4+c]-d[(y*w+w-1)*4+c]);n++}for(let x=0;x<w;x++)for(let c=0;c<4;c++){sum+=Math.abs(d[x*4+c]-d[((h-1)*w+x)*4+c]);n++}return n?sum/n:0}
const api={image,copy,rect,resample,seamless,lockEdges,heal,applyMasked,edgeError};
if(typeof module!=='undefined')module.exports=api;root.TextureCore=api;
})(typeof self!=='undefined'?self:globalThis);
