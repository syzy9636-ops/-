import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import vm from 'node:vm'

// Import the guide's data only; its standalone page is not embedded in the site.
const sourceDirectory = process.argv[2]
if (!sourceDirectory) throw new Error('请提供 UE56-Material-Guide 文件夹路径')
const context = vm.createContext({ window: {} })
for (const file of ['data.js', 'sources.js']) {
  vm.runInContext(await readFile(join(sourceDirectory, file), 'utf8'), context, { timeout: 1000 })
}
const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
const names = new Set()
const common = new Set(context.window.COMMON_NODES)
const groups = context.window.NODE_GROUPS.map((group) => ({
  id: group.id,
  name: group.name,
  nodes: group.nodes.trim().split('\n').filter(Boolean).map((line) => {
    const fields = line.trim().split('|')
    const [name, chinese, purpose, example, caution] = fields
    const source = context.window.NODE_SOURCES[normalize(name)]
    if (fields.length !== 5 || fields.some((field) => !field) || !source || names.has(name)) {
      throw new Error(`无效或重复的节点：${name}`)
    }
    names.add(name)
    if (new URL(source.url).hostname !== 'dev.epicgames.com') throw new Error(`来源无效：${name}`)
    return { name, chinese, purpose, example, caution, source, common: common.has(name) }
  }),
}))
const output = resolve('src/data/ue-material-guide.json')
await mkdir(resolve('src/data'), { recursive: true })
await writeFile(output, JSON.stringify({ version: '5.6', groups }, null, 2) + '\n')
console.log(`已导入 ${names.size} 个条目 / ${groups.length} 个分类`)
