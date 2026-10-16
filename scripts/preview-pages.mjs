import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { resolve, sep, extname } from 'node:path'

// Local static preview under a repository subpath, with GitHub Pages-style headers.
const root=resolve('dist'), prefix='/knowledge-preview/', port=5184
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.txt':'text/plain; charset=utf-8'}
http.createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
  if(pathname==='/'){res.writeHead(302,{Location:prefix});res.end();return}
  if(!pathname.startsWith(prefix)){res.writeHead(404);res.end();return}
  if(process.argv.includes('--checks')&&pathname===prefix+'checks.html'){
   const body=await readFile('.preview-check/seamless-check.html');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(body);return
  }
  const path=resolve(root,pathname.slice(prefix.length)||'index.html')
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);res.end();return}
  const file=path===root?resolve(root,'index.html'):path
  const info=await stat(file)
  if(!info.isFile())throw Error('Not a file')
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache'})
  createReadStream(file).pipe(res)
 } catch {res.writeHead(404);res.end('Not found')}
}).listen(port,'127.0.0.1',()=>console.log(`Static preview: http://127.0.0.1:${port}${prefix}?tool=seamless`))
