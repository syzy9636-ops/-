import React, { useEffect, useRef, useState } from 'react'
import { Bookmark, Check, Copy, ArrowUpRight, GitBranch, FlaskConical, Info } from 'lucide-react'
import { drawMaterialDiagram, diagramNames } from './materialDiagram.js'

function MaterialDiagram({ name }) {
  const canvasRef = useRef(null)
  const [caption, setCaption] = useState('')
  useEffect(() => {
    if (canvasRef.current) setCaption(drawMaterialDiagram(canvasRef.current, name))
  }, [name])
  return <figure className="material-diagram">
    <canvas ref={canvasRef} width="600" height="250" role="img" aria-label={`${name}：${caption}`} />
    <figcaption>{caption}<span>原理示意 · 非引擎实时渲染</span></figcaption>
  </figure>
}

export function MaterialDetails({ entry, saved, onToggleSaved, onRelated }) {
  const [copyState, setCopyState] = useState('idle')
  const copyName = async () => {
    try { await navigator.clipboard.writeText(entry.title); setCopyState('done') }
    catch { setCopyState('failed') }
  }
  return <>
    <div className="material-actions">
      <button type="button" onClick={copyName}>{copyState === 'done' ? <Check size={16} /> : <Copy size={16} />}<span>{copyState === 'done' ? '已复制' : '复制英文名'}</span></button>
      <button type="button" onClick={() => onToggleSaved(entry.title)} aria-pressed={saved}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? '已收藏' : '收藏节点'}</button>
    </div>
    <span className="material-copy-status" role="status">{copyState === 'failed' ? '复制未成功，可选中上方英文名手动复制。' : copyState === 'done' ? '英文节点名已复制。' : ''}</span>
    {diagramNames.has(entry.title) && <MaterialDiagram name={entry.title} />}
    <section className="material-detail-section"><h3><FlaskConical size={17} />简单例子</h3><p>{entry.example}</p></section>
    <section className="material-detail-section material-caution"><h3><Info size={17} />注意事项</h3><p>{entry.caution}</p></section>
    <section className="material-detail-section"><h3><GitBranch size={17} />相关节点</h3><div className="material-related">
      {entry.related.map((node) => <button type="button" key={node.name} onClick={() => onRelated(node.name)}><span><strong>{node.chinese}</strong><small>{node.name}</small></span><ArrowUpRight size={14} /></button>)}
    </div></section>
  </>
}
