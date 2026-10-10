import guide from './data/ue-material-guide.json' with { type: 'json' }

export const ueHome = 'https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-material-expressions-reference?application_version=5.6'
const styles = {
  basic: ['PARAMETERS', 'gold'], color: ['COLOR & BLENDING', 'coral'],
  texture: ['TEXTURE & SAMPLING', 'blue'], uv: ['UV & COORDINATES', 'teal'],
  mask: ['MASK & TRANSPARENCY', 'violet'], normal: ['NORMAL & REFLECTION', 'blue'],
  math: ['MATH & CHANNELS', 'gold'], effect: ['PROCEDURAL EFFECTS', 'coral'],
  particle: ['PARTICLE EFFECTS', 'violet'], landscape: ['LANDSCAPE', 'teal'],
  render: ['RENDERING & COMPATIBILITY', 'paper'], functions: ['MATERIAL FUNCTIONS', 'gold'],
}
const aliases = {
  LinearInterpolate: 'lerp 线性插值 混合', TextureCoordinate: 'texcoord 平铺 坐标',
  ComponentMask: 'mask 通道蒙版 遮罩 ORM RGBA', OneMinus: '反转 invert',
  WorldAlignedTexture: '三平面 triplanar 世界投射 白盒 网格', Multiply: '乘法 正片叠底 Blend_Multiply',
  ScalarParameter: '参数 数字', VectorParameter: '参数 变色 染色', Fresnel: '菲涅尔 边缘光',
  Step: '二值化 溶解', SmoothStep: '平滑 溶解', Constant3Vector: '颜色 白盒',
  TextureSample: '纹理 漫反射 diffuse basecolor', DepthFade: '软粒子 交界', Noise: '溶解 马赛克',
}
const related = {
  LinearInterpolate: ['Multiply', 'VertexColor', 'ComponentMask', 'VectorParameter'],
  Multiply: ['VectorParameter', 'TextureSample', 'LinearInterpolate'],
  TextureCoordinate: ['Multiply', 'Panner', 'Rotator', 'WorldAlignedTexture'],
  TextureSample: ['TextureCoordinate', 'TextureSampleParameter2D', 'ComponentMask'],
  WorldAlignedTexture: ['TextureObject', 'WorldAlignedNormal', 'VectorParameter'],
  Step: ['SmoothStep', 'If', 'Saturate'], DepthFade: ['PixelDepth', 'SceneDepth', 'ParticleColor'],
  Fresnel: ['PixelNormalWS', 'DotProduct', 'CameraVectorWS'],
  Constant3Vector: ['VectorParameter', 'Multiply', 'Constant4Vector'],
}
const nodeChineseNames = new Map(guide.groups.flatMap((group) => group.nodes.map((node) => [node.name, node.chinese])))

export const ueCategories = guide.groups.map((group) => ({
  id: `ue-${group.id}`, platform: 'ue', label: group.name.replace('（补充）', ''),
  english: styles[group.id][0], short: group.id.toUpperCase(), tone: styles[group.id][1], source: ueHome,
  entries: group.nodes.map((node) => {
    const isFunction = group.id === 'functions'
    const legacy = node.name === 'AtmosphericFogColor'
    const supplement = isFunction || node.source.basis.startsWith('补充')
    return {
      id: `ue-${node.name.toLowerCase()}`, kind: 'material-node', title: node.name,
      subtitle: node.chinese, note: node.purpose, example: node.example, caution: node.caution,
      source: node.source.url, sourceBasis: node.source.basis, images: [],
      common: node.common, legacy, aliases: aliases[node.name] || '',
      tags: [isFunction ? '材质函数' : '材质表达式', ...(node.common ? ['常用'] : []), ...(legacy ? ['已弃用'] : []), ...(supplement ? ['补充'] : [])],
      related: (related[node.name] || group.nodes.filter((other) => other.name !== node.name).slice(0, 3).map((other) => other.name))
        .map((name) => ({ name, chinese: nodeChineseNames.get(name) })),
    }
  }),
}))

export function matchesEntry(entry, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const searchable = [entry.title, entry.subtitle, entry.note, entry.example, entry.usage,
    entry.connection, entry.caution, entry.category, entry.categoryEnglish, entry.platform,
    entry.aliases, ...entry.tags, ...(entry.details || []).flat()].filter(Boolean).join(' ').toLowerCase()
  const compactTitle = entry.title.toLowerCase().replace(/[^a-z0-9]/g, '')
  return terms.every((term) => searchable.includes(term) ||
    (/[a-z]/i.test(term) && compactTitle.includes(term.replace(/[^a-z0-9]/g, ''))))
}
