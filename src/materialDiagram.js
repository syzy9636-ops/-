export const diagramNames = new Set(['Multiply', 'Add', 'LinearInterpolate', 'OneMinus', 'Step', 'SmoothStep', 'Power', 'Frac', 'Fresnel', 'TextureCoordinate', 'WorldAlignedTexture', 'Constant3Vector', 'VectorParameter', 'Panner', 'Time', 'Sine', 'Cosine'])

// Draw once when a detail opens. No render loop or additional image downloads.
export function drawMaterialDiagram(canvas, name) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return '当前浏览器无法显示示意图'
  const w = 600, h = 250
  canvas.width = w; canvas.height = h
  ctx.fillStyle = '#102424'; ctx.fillRect(0, 0, w, h)
  let caption = '', leftLabel = '输入', rightLabel = '结果'
  const colorA = [221, 134, 111], colorB = [125, 154, 196]
  const gray = (v) => `rgb(${Array(3).fill(Math.round(Math.max(0, Math.min(1, v)) * 255)).join(',')})`
  const strip = (left, fn) => { for (let x = 0; x < 240; x++) { ctx.fillStyle = fn(x / 240); ctx.fillRect(left + x, 58, 1, 150) } }
  if (['Multiply', 'Add', 'LinearInterpolate', 'Constant3Vector', 'VectorParameter'].includes(name)) {
    ctx.fillStyle = `rgb(${colorA})`; ctx.fillRect(30, 58, 100, 150)
    ctx.fillStyle = `rgb(${colorB})`; ctx.fillRect(155, 58, 100, 150)
    let result = colorA
    if (name === 'Multiply') { result = colorA.map((v, i) => Math.round(v * colorB[i] / 255)); caption = '两种颜色逐通道相乘' }
    else if (name === 'Add') { result = colorA.map((v, i) => Math.min(255, v + colorB[i])); caption = '两种颜色相加（示意显示限制在 0～1）' }
    else if (name === 'LinearInterpolate') { result = colorA.map((v, i) => (v + colorB[i]) / 2); caption = 'Alpha = 0.5：两种颜色各占一半' }
    else { caption = 'RGB 数值对应一种颜色'; leftLabel = '可选颜色' }
    strip(330, () => `rgb(${result})`)
  } else if (['TextureCoordinate', 'WorldAlignedTexture', 'Panner'].includes(name)) {
    const grid = (left, n, shift = 0) => {
      ctx.save(); ctx.beginPath(); ctx.rect(left, 58, 240, 150); ctx.clip()
      for (let y = 0; y < n; y++) for (let x = -1; x <= n; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#e8dcc7' : '#3a7773'
        ctx.fillRect(left + x * 240 / n + shift, 58 + y * 150 / n, 240 / n + .5, 150 / n + .5)
      }
      ctx.restore()
    }
    grid(30, 3); grid(330, name === 'Panner' ? 3 : 6, name === 'Panner' ? 32 : 0)
    leftLabel = name === 'Panner' ? '原始 UV' : '低重复次数'
    rightLabel = name === 'Panner' ? '平移后' : '高重复次数'
    caption = name === 'Panner' ? 'UV 平移：图案移动，重复密度保持不变' : '坐标比例决定图案重复密度（平面示意）'
  } else if (name === 'Fresnel') {
    ctx.fillStyle = '#78a7a0'; ctx.beginPath(); ctx.arc(150, 133, 74, 0, Math.PI * 2); ctx.fill()
    for (let r = 74; r > 0; r--) { ctx.fillStyle = gray((r / 74) ** 5); ctx.beginPath(); ctx.arc(450, 133, r, 0, Math.PI * 2); ctx.fill() }
    leftLabel = '表面'; rightLabel = '角度遮罩'; caption = '正面较暗，掠射角处较亮（示意）'
  } else {
    strip(30, gray)
    const curves = {
      OneMinus: [(v) => 1 - v, '1 - 输入：黑白翻转'], Step: [(v) => v < .5 ? 0 : 1, '阈值 0.5：只保留黑与白'],
      SmoothStep: [(v) => { const t = Math.max(0, Math.min(1, (v - .3) / .4)); return t * t * (3 - 2 * t) }, '0.3～0.7 之间平滑过渡'],
      Power: [(v) => v * v, '指数 2：中间灰变暗'], Frac: [(v) => v * 4 % 1, '输入 × 4 再取小数：四次循环'],
      Sine: [(v) => (Math.sin(v * Math.PI * 4) + 1) / 2, '正弦值重映射到 0～1，展示两个周期'],
      Cosine: [(v) => (Math.cos(v * Math.PI * 4) + 1) / 2, '余弦值重映射到 0～1，展示两个周期'],
      Time: [(v) => v, '时间提供持续增长的数值（静态渐变示意）'],
    }
    const [curve, description] = curves[name] || [(v) => v, '数值变化示意']
    strip(330, (v) => gray(curve(v))); caption = description
  }
  ctx.font = '19px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#a7a69a'; ctx.textAlign = 'center'
  ctx.fillText(leftLabel, 150, 34); ctx.fillText(rightLabel, 450, 34)
  ctx.strokeStyle = '#c9a56c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(280, 133); ctx.lineTo(311, 133); ctx.lineTo(303, 126); ctx.moveTo(311, 133); ctx.lineTo(303, 140); ctx.stroke()
  return caption
}
