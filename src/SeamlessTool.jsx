import React, { useRef, useState } from 'react'
import './seamless-tool.css'

export default function SeamlessTool({ active }) {
  const [loaded, setLoaded] = useState(false)
  const visited = useRef(active)
  if (active) visited.current = true
  if (!visited.current) return null
  return <section className="seamless-workspace" hidden={!active} aria-label="四方连续贴图工作台">
    {!loaded && <div className="seamless-loading" role="status">正在打开贴图工作台…</div>}
    <iframe title="四方连续贴图编辑器" src={`${import.meta.env.BASE_URL}tools/seamless/index.html`}
      onLoad={() => setLoaded(true)} allow="clipboard-read; clipboard-write; fullscreen" allowFullScreen />
  </section>
}
