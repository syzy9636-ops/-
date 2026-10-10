import guide from './data/blender-shader-guide.json' with { type: 'json' }

export const blenderManual = 'https://docs.blender.org/manual/en/5.1/render/shader_nodes/index.html'

const tones = {
  shader: 'violet', textures: 'blue', color: 'coral', displacement: 'teal',
  input: 'gold', vector: 'blue', math: 'violet', volume: 'teal',
  hair: 'coral', output: 'gold', logic: 'paper', layout: 'blue',
}

const engineLabels = { both: 'Cycles / Eevee', cycles: 'Cycles', eevee: 'Eevee' }

export const blenderShaderCategories = guide.categories.map((category) => ({
  id: `blender-shader-${category.id}`,
  platform: 'blender-material',
  label: category.name,
  english: category.en,
  short: category.en,
  tone: tones[category.id],
  source: blenderManual,
  entries: guide.nodes.filter((node) => node.category === category.id).map((node) => ({
    id: `blender-shader-${node.id}`,
    kind: 'shader-node',
    title: node.en,
    subtitle: node.zh,
    note: node.description,
    usage: node.use,
    connection: node.connection,
    caution: node.note,
    details: node.details,
    engine: engineLabels[node.engine],
    common: node.common,
    asset: node.asset,
    aliases: `${node.tags} ${node.officialZh || ''}`,
    source: node.url,
    tags: [engineLabels[node.engine], ...(node.common ? ['常用'] : []), ...(node.asset ? ['节点组资产'] : [])],
    images: [],
  })),
}))
