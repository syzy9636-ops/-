import React from 'react'
import { GitBranch, Info, Lightbulb, SlidersHorizontal } from 'lucide-react'

export default function BlenderShaderDetails({ entry }) {
  return <>
    <section className="material-detail-section">
      <h3><Lightbulb size={17} />适用场景</h3>
      <p>{entry.usage}</p>
    </section>
    <section className="material-detail-section">
      <h3><GitBranch size={17} />接线示例</h3>
      <p className="shader-connection">{entry.connection}</p>
    </section>
    {entry.details?.length > 0 && <section className="material-detail-section">
      <h3><SlidersHorizontal size={17} />参数与模式</h3>
      <dl className="shader-detail-list">
        {entry.details.map(([name, description]) => <div key={name}><dt>{name}</dt><dd>{description}</dd></div>)}
      </dl>
    </section>}
    <section className="material-detail-section material-caution">
      <h3><Info size={17} />注意事项</h3>
      <p>{entry.caution}</p>
    </section>
  </>
}
