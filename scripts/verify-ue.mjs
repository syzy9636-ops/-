import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { allEntries, categories } from '../src/data.js'
import guide from '../src/data/ue-material-guide.json' with { type: 'json' }
import { matchesEntry } from '../src/ueMaterials.js'

const ue = allEntries.filter((entry) => entry.platform === 'ue')
assert.equal(ue.length, 160)
assert.equal(allEntries.length, 266)
assert.equal(categories.length, 20)
assert.equal(new Set(allEntries.map((entry) => entry.id)).size, allEntries.length)
for (const group of guide.groups) for (const node of group.nodes) {
  const entry = ue.find((item) => item.title === node.name)
  assert.deepEqual([entry.subtitle, entry.note, entry.example, entry.caution, entry.source, entry.sourceBasis],
    [node.chinese, node.purpose, node.example, node.caution, node.source.url, node.source.basis])
  assert(entry.related.every((name) => ue.some((other) => other.title === name)))
  assert.equal(new URL(entry.source).hostname, 'dev.epicgames.com')
}
assert(matchesEntry(ue.find((entry) => entry.title === 'LinearInterpolate'), 'lerp 混合'))
assert(matchesEntry(ue.find((entry) => entry.title === 'TextureCoordinate'), 'texture coordinate'))

// Optional module path lets the desktop's bundled Playwright run this without adding a production dependency.
const { chromium } = await import(process.argv[2] || 'playwright')
await mkdir('.preview-check', { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { channel: process.argv[3] } : {}) })
const errors = [], missing = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' })
  // Keep this UI check independent of remote video/font availability.
  await page.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => { if (response.url().startsWith('http://127.0.0.1:5173') && response.status() >= 400) missing.push(response.url()) })
  await page.goto('http://127.0.0.1:5173/?platform=ue')
  await page.locator('.material-entry').first().waitFor()
  assert.equal(await page.locator('.material-entry').count(), 24)
  assert.equal(await page.locator('.hero-stat strong').first().textContent(), '160')
  await page.getByRole('button', { name: '加载更多记录' }).click()
  assert.equal(await page.locator('.material-entry').count(), 48)
  await page.getByRole('button', { name: '常用节点', exact: true }).click()
  assert.equal(await page.locator('.material-entry').count(), 22)
  await page.getByRole('button', { name: '全部节点', exact: true }).click()
  await page.getByRole('textbox', { name: '搜索知识库' }).fill('菲涅尔')
  await page.locator('.material-entry').filter({ hasText: 'Fresnel' }).click()
  const drawer = page.getByRole('dialog', { name: 'Fresnel 详情' })
  await drawer.waitFor()
  assert.equal(await drawer.locator('canvas').count(), 1)
  const colors = await drawer.locator('canvas').evaluate((canvas) => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    const values = new Set()
    for (let i = 0; i < pixels.length; i += 64) values.add(pixels.slice(i, i + 3).join(','))
    return values.size
  })
  assert(colors > 10)
  assert((await drawer.getByRole('link', { name: 'Epic文档', exact: true }).getAttribute('href')).includes('application_version=5.6'))
  await drawer.getByRole('button', { name: '收藏节点', exact: true }).click()
  await drawer.screenshot({ path: '.preview-check/ue-detail.png' })
  await drawer.getByRole('button', { name: 'PixelNormalWS', exact: true }).click()
  await page.getByRole('dialog', { name: 'PixelNormalWS 详情' }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('textbox', { name: '搜索知识库' }).fill('')
  await page.getByRole('button', { name: '已收藏', exact: true }).click()
  assert.equal(await page.locator('.material-entry').count(), 1)
  await page.reload()
  await page.getByRole('button', { name: '已收藏', exact: true }).click()
  assert.equal(await page.locator('.material-entry').count(), 1)
  await page.getByRole('button', { name: '全部节点', exact: true }).click()
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 960 })
    await page.evaluate(() => window.scrollTo(0, 0))
    const overflow = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth > innerWidth,
      title: document.querySelector('.warp-text-face').getBoundingClientRect().width > document.querySelector('.hero-copy').clientWidth + 2,
    }))
    assert(!overflow.page && !overflow.title, `Overflow at ${width}: ${JSON.stringify(overflow)}`)
    await page.screenshot({ path: `.preview-check/ue-${width}.png` })
  }
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.getByRole('navigation', { name: '知识库平台' }).getByRole('button', { name: /Blender/ }).click()
  assert.equal(await page.locator('.entry-card').count(), 16)
  await page.locator('.entry-card').first().click()
  await page.getByRole('button', { name: '放大案例图 1', exact: true }).click()
  assert.equal(await page.locator('.lightbox-layer.is-open').count(), 1)
  await page.getByRole('button', { name: '关闭大图', exact: true }).last().click()
  await page.getByRole('dialog').filter({ has: page.locator('.detail-topbar') }).getByRole('button', { name: '关闭详情', exact: true }).click()
  await page.getByRole('button', { name: /RGBA 通道工具/ }).click()
  await page.getByRole('tab', { name: '拆分', exact: true }).click()
  assert.equal(await page.locator('.rgba-workspace').count(), 1)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('http://127.0.0.1:5173/?platform=ue')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.knowledge-title')).opacity === '1')
  await page.getByRole('heading', { name: 'UE 材质节点', exact: true }).scrollIntoViewIfNeeded()
  await page.locator('.entry-card').first().scrollIntoViewIfNeeded()
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.entry-card')).opacity === '1')
  await page.screenshot({ path: '.preview-check/ue-catalog.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForFunction(() => document.querySelector('.sidebar').getBoundingClientRect().right <= 0)
  await page.getByRole('button', { name: '打开分类菜单' }).click()
  await page.getByRole('navigation', { name: '知识库平台' }).getByRole('button', { name: /After Effects/ }).click()
  await page.locator('.entry-card').first().scrollIntoViewIfNeeded()
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.entry-card')).opacity === '1')
  assert.equal(await page.locator('.entry-card').count(), 24)
  assert.deepEqual(errors, [])
  assert.deepEqual(missing, [])
  console.log(JSON.stringify({ entries: allEntries.length, ue: ue.length, diagrams: colors, responsive: [1440,1024,768,390], errors, missing, checks: 'Full content mapping, pagination, common nodes, search, detail, related nodes, favorites persistence, original Blender image lightbox, RGBA modes' }))
} finally { await browser.close() }
