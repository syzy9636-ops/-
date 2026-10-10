import React from 'react'
import { Box, Layers3, LibraryBig, Workflow } from 'lucide-react'
import './platform-artwork.css'

const assetBase = `${import.meta.env.BASE_URL}assets/platforms/`
const artwork = {
  ae: { name: 'After Effects', title: '合成与动效', topic: '图层 / 效果 / 关键帧', icon: Layers3, mark: 'Ae', alt: '角色画面合成预览，配合图层时间轴与关键帧示意' },
  blender: { name: 'Blender', title: '几何与材质', topic: '几何 / 贴图 / 着色', icon: Box, mark: 'B', alt: '由规则网格生成的立方体阵列，以波形控制高度，橙色标记选中列' },
  'blender-geometry': { name: 'Blender', title: '几何节点', topic: '运算 / 矢量 / 形态', icon: Box, mark: 'B', asset: 'blender', alt: '由规则网格生成的立方体阵列，以波形控制高度，橙色标记选中列' },
  'blender-material': { name: 'Blender', title: '材质节点', topic: '贴图 / 着色 / 输出', icon: Workflow, mark: 'B', asset: 'blender-material', alt: 'Blender 材质预览：青灰色织纹立方体、棋格釉面球体与铜色金属圆柱' },
  ue: { name: 'Unreal Engine', title: '材质与着色', topic: '参数 / 运算 / 表面', icon: Workflow, mark: 'UE', alt: '青绿色金属材质球与两种粗糙度的对照样本，下方为材质节点连接示意' },
  all: { name: 'FX Knowledge', title: '制作知识索引', topic: 'COMPOSITING / GEOMETRY / MATERIALS', icon: LibraryBig, mark: 'FX' },
}

function NodeStrip({ platform }) {
  const nodes = platform === 'ue'
    ? [{ title: '颜色参数', type: 'Vector' }, { title: '强度相乘', type: 'Multiply' }, { title: '自发光', type: 'Emissive' }]
    : platform === 'blender-material'
    ? [{ title: '图像纹理', type: 'Image Texture' }, { title: '原理化 BSDF', type: 'Principled BSDF' }, { title: '材质输出', type: 'Material Output' }]
    : [{ title: '网格', type: 'Grid' }, { title: '设置位置', type: 'Set Position' }, { title: '组输出', type: 'Output' }]
  return <ol className="artwork-nodes" aria-label={platform === 'ue' || platform === 'blender-material' ? '材质节点流程示意' : '几何节点流程示意'}>
    {nodes.map((node) => <li key={node.type}><strong>{node.title}</strong><span>{node.type}</span></li>)}
  </ol>
}

function Timeline() {
  return <div className="artwork-timeline" aria-label="合成图层与关键帧时间轴示意">
    <div className="artwork-time-ruler"><span>00:00</span><span>00:01</span><span>00:02</span></div>
    {[['效果', 'fx'], ['调色', 'color'], ['画面', 'footage']].map(([label, kind]) => <div className={`artwork-track artwork-track-${kind}`} key={kind}>
      <span>{label}</span><div><i /><i /></div>
    </div>)}
    <span className="artwork-playhead" aria-hidden="true" />
  </div>
}

export default function PlatformArtwork({ platform, count, counts }) {
  const info = artwork[platform] || artwork.all
  const Icon = info.icon
  return <div className={`platform-artwork artwork-${platform} ${platform.startsWith('blender-') ? 'artwork-blender' : ''}`} data-platform={platform}>
    <header className="artwork-header">
      <span className="artwork-mark" aria-hidden="true">{info.mark}</span>
      <div><span className="artwork-software">{info.name}</span><h2>{info.title}</h2></div>
      <span className="artwork-count"><Icon size={17} strokeWidth={1.5} /><span>{String(count).padStart(3, '0')}</span></span>
    </header>
    {platform === 'all' ? <div className="artwork-index">
      {['ae', 'blender', 'ue'].map((id, index) => <div className={`artwork-index-row artwork-index-${id}`} key={id}>
        <img src={`${assetBase}${id}.webp`} width="960" height="600" alt={artwork[id].alt} decoding="async" />
        <div><span className="artwork-row-number">0{index + 1} / {artwork[id].name}</span><strong>{artwork[id].title}</strong><span>{id === 'blender' ? counts['blender-geometry'] + counts['blender-material'] : counts[id]} 条记录</span></div>
      </div>)}
    </div> : <>
      <div className="artwork-viewport">
        <img src={`${assetBase}${info.asset || platform}.webp`} width="960" height="600" alt={info.alt} fetchPriority="high" decoding="async" />
        <span className="artwork-viewport-label">{platform === 'ae' ? 'COMPOSITION 01' : platform === 'blender-geometry' ? 'GEOMETRY NODES' : platform === 'blender-material' ? 'SHADER NODES' : 'MATERIAL PREVIEW'}</span>
        {platform === 'ae' && <div className="artwork-composition-bounds" aria-hidden="true"><i /><i /><i /><i /></div>}
        {platform === 'blender-geometry' && <span className="artwork-axis" aria-hidden="true"><i>X</i><i>Y</i><i>Z</i></span>}
        {(platform === 'ue' || platform === 'blender-material') && <span className="artwork-swatches" aria-hidden="true"><i /><i /><i /></span>}
      </div>
      {platform === 'ae' ? <Timeline /> : <NodeStrip platform={platform} />}
    </>}
    <footer className="artwork-footer"><span>{info.topic}</span><Icon size={15} aria-hidden="true" /></footer>
  </div>
}
