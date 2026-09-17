import React, { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Aperture,
  ArrowRightLeft,
  ArrowUpRight,
  BookOpen,
  Box,
  Braces,
  ChevronRight,
  CircleDot,
  Download,
  ExternalLink,
  FileImage,
  Layers3,
  Menu,
  RefreshCcw,
  Scissors,
  Search,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import gsap from 'gsap'
import { allEntries, blenderHome, categories, notionHome, platforms } from './data'
import './styles.css'

const assetBase = import.meta.env.BASE_URL
const backgroundVideos = [
  { bvid: 'BV12719BzEKD', playbackMs: 250800 },
  { bvid: 'BV14moRYUELm', playbackMs: 15800 },
]

const entryAssetExtensions = {
  bcc: ['webp', 'webp', 'gif', 'gif', 'gif', 'gif', 'gif', 'gif', 'webp', 'gif', 'gif', 'gif', 'webp', 'gif', 'webp', 'webp', 'gif'],
  psoft: ['webp', 'webp', 'gif', 'webp', 'webp', 'webp', 'webp', 'gif', 'gif', 'webp', 'gif', 'webp', 'gif', 'gif', 'webp', 'webp', 'webp', 'gif', 'gif', 'webp', 'webp', 'webp', 'webp', 'webp', 'webp'],
  visual: ['webp', 'webp', 'webp', 'webp', 'gif', 'gif', 'webp', 'gif', 'webp', 'webp', 'gif', 'webp', 'webp', 'webp', 'gif', 'gif', 'webp', 'gif', 'webp', 'gif', 'webp', 'webp', 'gif', 'webp', 'webp', 'webp', 'webp', 'webp'],
  material: ['webp', 'webp', 'webp', 'webp', 'webp'],
  builtin: ['webp', 'webp', 'webp', 'gif', 'webp', 'gif', 'webp', 'webp', 'webp'],
  scripts: ['webp', 'webp', 'webp', 'webp', 'webp', 'webp'],
}

const entryImageUrl = (entry) => {
  if (entry.images?.length) return `${assetBase}assets/${entry.images[0]}`
  const extension = entryAssetExtensions[entry.categoryId]?.[Number(entry.number) - 1] || 'webp'
  return `${assetBase}assets/knowledge/${entry.categoryId}-${entry.number}.${extension}`
}

const entryPreviewUrl = (entry) => {
  if (entry.images?.length) return `${assetBase}assets/${entry.images[0]}`
  const extension = entryAssetExtensions[entry.categoryId]?.[Number(entry.number) - 1] || 'webp'
  const base = `${assetBase}assets/knowledge/${entry.categoryId}-${entry.number}`
  return extension === 'gif' ? `${assetBase}assets/knowledge/posters/${entry.categoryId}-${entry.number}.jpg` : `${base}.${extension}`
}

const entryImageUrls = (entry) => entry.images?.length
  ? entry.images.map((path) => `${assetBase}assets/${path}`)
  : [entryImageUrl(entry)]

const categoryIcons = {
  bcc: Aperture,
  psoft: CircleDot,
  visual: Sparkles,
  material: Box,
  builtin: Layers3,
  scripts: Braces,
  'blender-geometry': Box,
  'blender-noise': CircleDot,
}

function BackgroundVideo() {
  const [activeVideo, setActiveVideo] = useState(0)
  const [loadedVideo, setLoadedVideo] = useState(-1)

  useEffect(() => {
    if (loadedVideo !== activeVideo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let timer = 0
    let startedAt = 0
    let remaining = backgroundVideos[activeVideo].playbackMs
    const scheduleNext = () => {
      window.clearTimeout(timer)
      startedAt = window.performance.now()
      timer = window.setTimeout(() => {
        setActiveVideo((current) => (current + 1) % backgroundVideos.length)
      }, remaining)
    }
    const handleVisibility = () => {
      if (document.hidden) {
        remaining = Math.max(1000, remaining - (window.performance.now() - startedAt))
        window.clearTimeout(timer)
      } else {
        scheduleNext()
      }
    }

    scheduleNext()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [activeVideo, loadedVideo])

  const { bvid } = backgroundVideos[activeVideo]
  const playerUrl = `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0&autoplay=1&muted=1&hideCoverInfo=1&t=0`

  return (
    <div className="background-video" aria-hidden="true">
      <iframe
        className="background-video-player"
        key={bvid}
        src={playerUrl}
        title=""
        tabIndex="-1"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoadedVideo(activeVideo)}
      />
      <div className="background-video-shade" />
    </div>
  )
}

function AmbientField() {
  const fieldRef = useRef(null)

  useEffect(() => {
    const field = fieldRef.current
    if (!field || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    let targetX = 0
    let targetY = 0
    const update = () => {
      frame = 0
      field.style.setProperty('--mx', `${targetX}px`)
      field.style.setProperty('--my', `${targetY}px`)
    }
    const move = (event) => {
      if (event.pointerType === 'touch') return
      targetX = (event.clientX / window.innerWidth - 0.5) * 120
      targetY = (event.clientY / window.innerHeight - 0.5) * 90
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    const reset = () => {
      targetX = 0
      targetY = 0
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerleave', reset, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerleave', reset)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="ambient-field" ref={fieldRef} aria-hidden="true">
      <div className="ambient-lines">
        {Array.from({ length: 18 }, (_, index) => <span style={{ '--line': index }} key={index} />)}
      </div>
      <div className="ambient-dots">
        {Array.from({ length: 54 }, (_, index) => <i style={{ '--dot': index }} key={index} />)}
      </div>
    </div>
  )
}

function WarpText({ text }) {
  const textRef = useRef(null)
  const turbulenceRef = useRef(null)
  const displacementRef = useRef(null)

  useEffect(() => {
    const node = textRef.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    let pointerActive = false
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let lastFilterTick = -1
    const update = (time) => {
      const orbitX = pointerActive ? targetX : Math.sin(time / 2600) * 1.4
      const orbitY = pointerActive ? targetY : Math.cos(time / 3100) * 1.1
      currentX += (orbitX - currentX) * 0.14
      currentY += (orbitY - currentY) * 0.14
      node.style.setProperty('--warp-rotate-y', `${currentX * 0.34}deg`)
      node.style.setProperty('--warp-rotate-x', `${-currentY * 0.2}deg`)
      node.style.setProperty('--warp-shift-x', `${currentX * 0.55}px`)
      node.style.setProperty('--warp-shift-y', `${currentY * 0.4}px`)
      node.style.setProperty('--ripple-x', `${50 + currentX * 4}%`)
      node.style.setProperty('--ripple-y', `${50 + currentY * 4}%`)

      const filterTick = Math.floor(time / 33)
      if (filterTick !== lastFilterTick) {
        lastFilterTick = filterTick
        const intensity = Math.min(1, (Math.abs(currentX) + Math.abs(currentY)) / 12)
        turbulenceRef.current?.setAttribute('baseFrequency', `${0.006 + intensity * 0.004} ${0.011 + intensity * 0.006}`)
        displacementRef.current?.setAttribute('scale', `${5 + intensity * 10}`)
      }
      frame = window.requestAnimationFrame(update)
    }
    const move = (event) => {
      if (event.pointerType === 'touch') return
      const rect = node.getBoundingClientRect()
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 9
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 7
      pointerActive = true
    }
    const leave = () => {
      pointerActive = false
      targetX = 0
      targetY = 0
    }

    node.addEventListener('pointermove', move, { passive: true })
    node.addEventListener('pointerleave', leave, { passive: true })
    frame = window.requestAnimationFrame(update)
    return () => {
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerleave', leave)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <span className="warp-text" ref={textRef} aria-label={text}>
      <svg className="warp-text-filter" aria-hidden="true" focusable="false">
        <defs>
          <filter id="warp-text-filter-definition" x="-8%" y="-18%" width="116%" height="136%">
            <feTurbulence ref={turbulenceRef} type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="2" seed="17" result="warp-noise" />
            <feDisplacementMap ref={displacementRef} in="SourceGraphic" in2="warp-noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <span className="warp-text-glow" aria-hidden="true">{text}</span>
      <span className="warp-text-face" aria-hidden="true">{text}</span>
      <span className="warp-text-ripple" aria-hidden="true">{text}</span>
    </span>
  )
}

function ScrollBlur() {
  const blurRef = useRef(null)

  useEffect(() => {
    const blur = blurRef.current
    if (!blur || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    let timeout = 0
    const update = () => {
      frame = 0
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0
      blur.style.setProperty('--scroll-progress', progress.toFixed(3))
      blur.classList.add('is-active')
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => blur.classList.remove('is-active'), 280)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="scroll-blur" ref={blurRef} aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => <span style={{ '--blur-index': index }} key={index} />)}
    </div>
  )
}

const rgbaChannels = [
  { id: 'r', label: '红色通道', description: '写入输出 R', tone: 'coral', fallback: '黑色' },
  { id: 'g', label: '绿色通道', description: '写入输出 G', tone: 'teal', fallback: '黑色' },
  { id: 'b', label: '蓝色通道', description: '写入输出 B', tone: 'violet', fallback: '黑色' },
  { id: 'a', label: '透明通道', description: '写入输出 A', tone: 'paper', fallback: '不透明' },
]

const decodeLocalImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.onload = () => {
    URL.revokeObjectURL(url)
    resolve(image)
  }
  image.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error(`无法读取图片：${file.name}`))
  }
  image.src = url
})

const channelMeanings = [
  { id: 'none', code: '-', label: '无 / 不使用', fileLabel: 'Unused' },
  { id: 'metalness', code: 'M', label: '金属', fileLabel: 'Metalness' },
  { id: 'emissive', code: 'E', label: '发光', fileLabel: 'Emissive' },
  { id: 'ao', code: 'O', label: '环境光遮蔽', fileLabel: 'AO' },
  { id: 'roughness', code: 'R', label: '粗糙', fileLabel: 'Roughness' },
  { id: 'height', code: 'H', label: '高度', fileLabel: 'Height' },
  { id: 'mask', code: 'K', label: '遮罩', fileLabel: 'Mask' },
  { id: 'custom', code: 'X', label: '自定义', fileLabel: 'Custom' },
]

const splitPresets = {
  MEOR: { r: 'metalness', g: 'emissive', b: 'ao', a: 'roughness' },
  MORE: { r: 'metalness', g: 'ao', b: 'roughness', a: 'emissive' },
}

const channelOffsets = { r: 0, g: 1, b: 2, a: 3 }

const safeFileStem = (value, fallback = 'texture') => (value.trim() || fallback)
  .replace(/\.[^.]+$/, '')
  .replace(/[\\/:*?"<>|]+/g, '-')

function RgbaMergeTool({ files, setFiles, outputName, setOutputName }) {
  const [canvasSize, setCanvasSize] = useState(null)
  const [status, setStatus] = useState('等待上传通道贴图')
  const canvasRef = useRef(null)

  const activeFiles = Object.values(files).filter(Boolean)
  const canDownload = Boolean(canvasSize && activeFiles.length)

  useEffect(() => {
    let cancelled = false

    if (!activeFiles.length) {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = 1
        canvas.height = 1
        canvas.getContext('2d').clearRect(0, 0, 1, 1)
      }
      setCanvasSize(null)
      setStatus('等待上传通道贴图')
      return undefined
    }

    setStatus('正在合成…')
    Promise.all(Object.entries(files).map(async ([channel, file]) => [channel, file ? await decodeLocalImage(file) : null]))
      .then((decoded) => {
        if (cancelled) return

        const images = Object.fromEntries(decoded)
        const width = Math.max(...Object.values(images).filter(Boolean).map((image) => image.naturalWidth || image.width))
        const height = Math.max(...Object.values(images).filter(Boolean).map((image) => image.naturalHeight || image.height))
        const output = canvasRef.current
        if (!output) return

        output.width = width
        output.height = height
        const outputContext = output.getContext('2d', { willReadFrequently: true })
        const outputData = outputContext.createImageData(width, height)

        rgbaChannels.forEach(({ id }) => {
          const image = images[id]
          const channelCanvas = document.createElement('canvas')
          channelCanvas.width = width
          channelCanvas.height = height
          const channelContext = channelCanvas.getContext('2d', { willReadFrequently: true })
          const defaultValue = id === 'a' ? 255 : 0

          if (image) {
            channelContext.imageSmoothingEnabled = true
            channelContext.drawImage(image, 0, 0, width, height)
          }

          const sourceData = image
            ? channelContext.getImageData(0, 0, width, height).data
            : null
          const offset = id === 'r' ? 0 : id === 'g' ? 1 : id === 'b' ? 2 : 3

          for (let index = 0; index < outputData.data.length; index += 4) {
            const value = sourceData
              ? Math.round(sourceData[index] * 0.2126 + sourceData[index + 1] * 0.7152 + sourceData[index + 2] * 0.0722)
              : defaultValue
            outputData.data[index + offset] = value
          }
        })

        outputContext.putImageData(outputData, 0, 0)
        setCanvasSize({ width, height })
        setStatus('合成完成，可下载 PNG')
      })
      .catch((error) => {
        if (!cancelled) setStatus(error.message || '图片读取失败')
      })

    return () => { cancelled = true }
  }, [files])

  const handleFileChange = (channel, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFiles((current) => ({ ...current, [channel]: file }))
    event.target.value = ''
  }

  const clearChannel = (channel) => {
    setFiles((current) => ({ ...current, [channel]: null }))
  }

  const resetTool = () => {
    setFiles({ r: null, g: null, b: null, a: null })
    setOutputName('rgba-composite')
  }

  const downloadResult = () => {
    if (!canDownload || !canvasRef.current) return
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const safeName = (outputName.trim() || 'rgba-composite')
        .replace(/\.png$/i, '')
        .replace(/[\\/:*?"<>|]+/g, '-')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${safeName}.png`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  return (
    <section className="rgba-tool" aria-labelledby="rgba-title">
      <div className="rgba-heading">
        <div>
          <span className="tool-eyebrow">EXTENSION TOOL / TEXTURE</span>
          <h1 id="rgba-title">RGBA 合并</h1>
          <p>分别指定 R、G、B、A 通道贴图，在浏览器本地合成为一张可下载的 PNG 纹理。</p>
        </div>
        <div className="rgba-local-note"><FileImage size={20} /><span>本地处理<br />图片不会上传</span></div>
      </div>

      <div className="rgba-layout">
        <div className="rgba-panel rgba-input-panel">
          <div className="rgba-panel-head"><div><span>01 / CHANNEL INPUT</span><h2>通道贴图</h2></div><span className="rgba-count">{activeFiles.length} / 4 已添加</span></div>
          <div className="rgba-channel-grid">
            {rgbaChannels.map((channel) => {
              const file = files[channel.id]
              return (
                <article className={`rgba-channel tone-${channel.tone}`} key={channel.id}>
                  <div className="rgba-channel-title"><strong>{channel.id.toUpperCase()}</strong><div><h3>{channel.label}</h3><span>{channel.description}</span></div></div>
                  <label className="rgba-upload">
                    <FileImage size={18} />
                    <span>{file ? '替换贴图' : '选择贴图'}</span>
                    <input type="file" accept="image/*" onChange={(event) => handleFileChange(channel.id, event)} />
                  </label>
                  <div className="rgba-file-row">
                    <span title={file?.name}>{file ? file.name : `未指定，使用${channel.fallback}`}</span>
                    {file && <button type="button" onClick={() => clearChannel(channel.id)} aria-label={`清除${channel.label}`}><X size={15} /></button>}
                  </div>
                </article>
              )
            })}
          </div>
          <p className="rgba-hint">图片会按亮度值写入对应通道；不同尺寸的贴图会拉伸到当前最大宽高。未提供 R/G/B 时为黑色，未提供 A 时为完全不透明。</p>
        </div>

        <div className="rgba-panel rgba-output-panel">
          <div className="rgba-panel-head"><div><span>02 / OUTPUT PREVIEW</span><h2>合成预览</h2></div><span className="rgba-status">{status}</span></div>
          <div className={`rgba-preview-wrap ${canvasSize ? 'has-preview' : ''}`}>
            {!canvasSize && <div className="rgba-preview-empty"><FileImage size={32} /><span>添加通道贴图后<br />将在这里预览</span></div>}
            <div className="rgba-checkerboard"><canvas ref={canvasRef} aria-label="RGBA 合成结果预览" /></div>
          </div>
          <div className="rgba-output-controls">
            <label className="rgba-name-field"><span>输出名称</span><div><input value={outputName} onChange={(event) => setOutputName(event.target.value)} /><b>.png</b></div></label>
            <div className="rgba-actions"><button className="rgba-reset" type="button" onClick={resetTool}><RefreshCcw size={16} />重置</button><button className="rgba-download" type="button" onClick={downloadResult} disabled={!canDownload}><Download size={17} />下载 PNG</button></div>
          </div>
          {canvasSize && <span className="rgba-dimensions">输出尺寸 {canvasSize.width} × {canvasSize.height}px</span>}
        </div>
      </div>
    </section>
  )
}

function RgbaSplitTool({ onTransferToMerge }) {
  const [sourceFile, setSourceFile] = useState(null)
  const [baseName, setBaseName] = useState('texture')
  const [mappings, setMappings] = useState({ ...splitPresets.MEOR })
  const [customNames, setCustomNames] = useState({ r: '', g: '', b: '', a: '' })
  const [sourceMeta, setSourceMeta] = useState(null)
  const [status, setStatus] = useState('等待导入 RGBA 合并贴图')
  const sourcePixelsRef = useRef(null)
  const previewRefs = useRef({})

  const meaningFor = (channel) => channelMeanings.find((item) => item.id === mappings[channel]) || channelMeanings[0]
  const labelFor = (channel) => {
    const meaning = meaningFor(channel)
    return meaning.id === 'custom'
      ? safeFileStem(customNames[channel], 'Custom')
      : meaning.fileLabel
  }
  const codeFor = (channel) => {
    const meaning = meaningFor(channel)
    if (meaning.id !== 'custom') return meaning.code
    return (customNames[channel].trim().charAt(0) || 'X').toUpperCase()
  }
  const packCode = rgbaChannels.map(({ id }) => codeFor(id)).join('')
  const outputFileName = (channel) => `${safeFileStem(baseName)}_${packCode}_${channel.toUpperCase()}_${labelFor(channel)}.png`
  const activeMappedChannels = rgbaChannels.filter(({ id }) => mappings[id] !== 'none')
  const hasMappedChannels = activeMappedChannels.length > 0

  const drawChannel = (channel, targetCanvas) => {
    const source = sourcePixelsRef.current
    if (!source || !targetCanvas) return
    const { width, height, data } = source
    targetCanvas.width = width
    targetCanvas.height = height
    const context = targetCanvas.getContext('2d')
    const output = context.createImageData(width, height)
    const offset = channelOffsets[channel]
    for (let index = 0; index < data.length; index += 4) {
      const value = data[index + offset]
      output.data[index] = value
      output.data[index + 1] = value
      output.data[index + 2] = value
      output.data[index + 3] = 255
    }
    context.putImageData(output, 0, 0)
  }

  useEffect(() => {
    let cancelled = false
    if (!sourceFile) {
      sourcePixelsRef.current = null
      setSourceMeta(null)
      setStatus('等待导入 RGBA 合并贴图')
      Object.values(previewRefs.current).forEach((canvas) => {
        if (!canvas) return
        canvas.width = 1
        canvas.height = 1
        canvas.getContext('2d').clearRect(0, 0, 1, 1)
      })
      return undefined
    }

    setStatus('正在读取通道…')
    decodeLocalImage(sourceFile)
      .then((image) => {
        if (cancelled) return
        const width = image.naturalWidth || image.width
        const height = image.naturalHeight || image.height
        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = width
        sourceCanvas.height = height
        const context = sourceCanvas.getContext('2d', { willReadFrequently: true })
        context.drawImage(image, 0, 0)
        sourcePixelsRef.current = context.getImageData(0, 0, width, height)
        rgbaChannels.forEach(({ id }) => drawChannel(id, previewRefs.current[id]))
        setSourceMeta({ width, height })
        setStatus('4 个通道已拆分，可分别下载')
      })
      .catch((error) => {
        if (!cancelled) setStatus(error.message || '图片读取失败')
      })

    return () => { cancelled = true }
  }, [sourceFile])

  const handleSourceChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSourceFile(file)
    setBaseName(safeFileStem(file.name, 'texture'))
    event.target.value = ''
  }

  const applyPreset = (preset) => {
    setMappings({ ...splitPresets[preset] })
  }

  const updateMapping = (channel, value) => {
    setMappings((current) => ({ ...current, [channel]: value }))
  }

  const downloadChannel = (channel) => {
    const canvas = previewRefs.current[channel]
    if (!sourceMeta || !canvas || mappings[channel] === 'none') return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = outputFileName(channel)
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  const downloadAll = () => {
    activeMappedChannels.forEach(({ id }) => downloadChannel(id))
  }

  const transferToMerge = async () => {
    if (!sourceMeta || !hasMappedChannels) return
    setStatus('正在把拆分结果带入合并…')
    try {
      const entries = await Promise.all(activeMappedChannels.map(({ id }) => new Promise((resolve, reject) => {
        const canvas = previewRefs.current[id]
        if (!canvas) {
          reject(new Error(`无法读取 ${id.toUpperCase()} 通道`))
          return
        }
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error(`无法生成 ${id.toUpperCase()} 通道贴图`))
            return
          }
          resolve([id, new File([blob], outputFileName(id), { type: 'image/png' })])
        }, 'image/png')
      })))
      onTransferToMerge(Object.fromEntries(entries), `${safeFileStem(baseName)}_${packCode}`)
      setStatus('已带入合并工具')
    } catch (error) {
      setStatus(error.message || '转移失败，请重试')
    }
  }

  const resetTool = () => {
    setSourceFile(null)
    setBaseName('texture')
    setMappings({ ...splitPresets.MEOR })
    setCustomNames({ r: '', g: '', b: '', a: '' })
  }

  return (
    <section className="rgba-tool rgba-split-tool" aria-labelledby="rgba-split-title">
      <div className="rgba-heading">
        <div>
          <span className="tool-eyebrow">EXTENSION TOOL / CHANNEL EXTRACTOR</span>
          <h1 id="rgba-split-title">RGBA 拆分</h1>
          <p>导入一张合并贴图，为 R、G、B、A 标注实际用途，再按自动生成的语义名称导出四张灰度贴图。</p>
        </div>
        <div className="rgba-local-note"><Scissors size={20} /><span>独立拆分工具<br />不会改动原图</span></div>
      </div>

      <div className="split-source-panel rgba-panel">
        <div className="rgba-panel-head"><div><span>01 / PACKED TEXTURE</span><h2>导入合并贴图</h2></div><span className="rgba-status">{status}</span></div>
        <div className="split-source-row">
          <label className="split-source-upload"><FileImage size={20} /><span>{sourceFile ? '替换合并贴图' : '选择 RGBA 贴图'}</span><input type="file" accept="image/*" onChange={handleSourceChange} /></label>
          <div className="split-source-info"><strong>{sourceFile?.name || '尚未选择文件'}</strong><span>{sourceMeta ? `${sourceMeta.width} × ${sourceMeta.height}px` : 'PNG / TGA 转换的 PNG / JPG / WEBP'}</span></div>
          {sourceFile && <button className="split-clear-source" type="button" onClick={() => setSourceFile(null)}><X size={16} />清除</button>}
        </div>
      </div>

      <div className="split-mapping-head">
        <div><span>02 / CHANNEL LABELS</span><h2>标注通道用途</h2></div>
        <div className="split-presets"><span>快捷映射</span><button type="button" onClick={() => applyPreset('MEOR')}>MEOR</button><button type="button" onClick={() => applyPreset('MORE')}>MORE</button></div>
      </div>

      <div className="split-channel-grid">
        {rgbaChannels.map((channel) => {
          const meaning = meaningFor(channel.id)
          const isUnused = meaning.id === 'none'
          return (
            <article className={`split-channel-card tone-${channel.tone} ${isUnused ? 'is-unused' : ''}`} key={channel.id}>
              <header><strong>{channel.id.toUpperCase()}</strong><div><span>{channel.label}</span><b>{codeFor(channel.id)}</b></div></header>
              <div className={`split-preview ${sourceMeta ? 'has-image' : ''}`}><canvas ref={(node) => { previewRefs.current[channel.id] = node }} aria-label={`${channel.label}拆分预览`} />{!sourceMeta && <span>等待贴图</span>}</div>
              <label className="split-meaning-field"><span>该通道内容</span><select value={mappings[channel.id]} onChange={(event) => updateMapping(channel.id, event.target.value)}>{channelMeanings.map((item) => <option value={item.id} key={item.id}>{item.code} / {item.label}</option>)}</select></label>
              {meaning.id === 'custom' && <label className="split-custom-field"><span>自定义名称</span><input value={customNames[channel.id]} onChange={(event) => setCustomNames((current) => ({ ...current, [channel.id]: event.target.value }))} placeholder="例如 Specular" /></label>}
              <div className="split-file-name" title={isUnused ? '该通道不导出' : outputFileName(channel.id)}>{isUnused ? '该通道不导出' : outputFileName(channel.id)}</div>
              <button className="split-download-one" type="button" disabled={!sourceMeta || isUnused} onClick={() => downloadChannel(channel.id)}><Download size={16} />{isUnused ? '不导出' : '下载此通道'}</button>
            </article>
          )
        })}
      </div>

      <div className="split-export-bar">
        <div><span>当前映射</span><strong>{packCode}</strong><p>命名示例：{outputFileName('r')}</p></div>
        <label className="split-base-name"><span>基础文件名</span><input value={baseName} onChange={(event) => setBaseName(event.target.value)} /></label>
        <div className="rgba-actions split-actions"><button className="rgba-reset" type="button" onClick={resetTool}><RefreshCcw size={16} />重置</button><button className="split-transfer" type="button" disabled={!sourceMeta || !hasMappedChannels} onClick={transferToMerge}><ArrowRightLeft size={17} />一键带入合并</button><button className="rgba-download" type="button" disabled={!sourceMeta || !hasMappedChannels} onClick={downloadAll}><Download size={17} />下载启用通道</button></div>
      </div>
      <p className="rgba-hint split-hint">拆分结果均为不透明灰度 PNG。点击“一键带入合并”会把已启用的结果自动放进合并模式对应通道；选择“无 / 不使用”的通道会保持空置。</p>
    </section>
  )
}

function RgbaToolWorkspace() {
  const [mode, setMode] = useState('merge')
  const [mergeFiles, setMergeFiles] = useState({ r: null, g: null, b: null, a: null })
  const [mergeOutputName, setMergeOutputName] = useState('rgba-composite')

  const receiveSplitChannels = (files, outputName) => {
    setMergeFiles({ r: null, g: null, b: null, a: null, ...files })
    setMergeOutputName(outputName)
    setMode('merge')
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  return (
    <div className="rgba-workspace">
      <div className="rgba-workspace-switcher">
        <div>
          <span>RGBA CHANNEL WORKSPACE</span>
          <strong>{mode === 'merge' ? '组合通道' : '提取通道'}</strong>
        </div>
        <div className="rgba-mode-switch" role="tablist" aria-label="切换 RGBA 工具">
          <button className={mode === 'merge' ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === 'merge'} onClick={() => setMode('merge')}><Layers3 size={17} />合并</button>
          <button className={mode === 'split' ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === 'split'} onClick={() => setMode('split')}><Scissors size={17} />拆分</button>
        </div>
      </div>
      <div className="rgba-workspace-pane" hidden={mode !== 'merge'}>
        <RgbaMergeTool files={mergeFiles} setFiles={setMergeFiles} outputName={mergeOutputName} setOutputName={setMergeOutputName} />
      </div>
      <div className="rgba-workspace-pane" hidden={mode !== 'split'}>
        <RgbaSplitTool onTransferToMerge={receiveSplitChannels} />
      </div>
    </div>
  )
}

function Sidebar({ activePlatform, activeCategory, activeTool, onPlatformChange, onCategoryChange, onToolChange, open, onClose }) {
  const visibleCategories = activePlatform === 'all'
    ? categories
    : categories.filter((category) => category.platform === activePlatform)

  const choosePlatform = (platformId) => {
    onPlatformChange(platformId)
    onToolChange(null)
    onClose()
  }

  const chooseCategory = (categoryId) => {
    onCategoryChange(categoryId)
    onToolChange(null)
    onClose()
  }

  const chooseTool = (tool) => {
    onToolChange(tool)
    onClose()
  }

  return (
    <>
      <button className={`sidebar-backdrop ${open ? 'is-open' : ''}`} type="button" aria-label="关闭分类菜单" onClick={onClose} />
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand-lockup">
          <span className="brand-mark">W</span>
          <div><strong>王恩涛</strong><small>VFX KNOWLEDGE BASE</small></div>
        </div>

        <nav className="platform-nav" aria-label="知识库平台">
          <span className="nav-label">按平台浏览</span>
          <div className="platform-nav-list">
            {platforms.map((platform) => {
              const count = platform.id === 'all'
                ? allEntries.length
                : allEntries.filter((entry) => entry.platform === platform.id).length
              return (
                <button className={`platform-nav-item tone-${platform.tone} ${activePlatform === platform.id ? 'is-active' : ''}`} type="button" onClick={() => choosePlatform(platform.id)} key={platform.id}>
                  <span><strong>{platform.label}</strong><small>{platform.english}</small></span>
                  <b>{count}</b>
                </button>
              )
            })}
          </div>
        </nav>

        <nav className="category-nav" aria-label="知识库分类">
          <span className="nav-label">按分类浏览</span>
          <button className={`category-nav-item ${activeCategory === 'all' ? 'is-active' : ''}`} type="button" onClick={() => chooseCategory('all')}>
            <BookOpen size={18} />
            <span><strong>全部记录</strong><small>{activePlatform === 'all' ? 'ALL NOTES' : 'CURRENT PLATFORM'}</small></span>
            <b>{activePlatform === 'all' ? allEntries.length : allEntries.filter((entry) => entry.platform === activePlatform).length}</b>
          </button>
          {visibleCategories.map((category) => {
            const Icon = categoryIcons[category.id]
            return (
              <button className={`category-nav-item tone-${category.tone} ${activeCategory === category.id ? 'is-active' : ''}`} type="button" onClick={() => chooseCategory(category.id)} key={category.id}>
                <Icon size={18} />
                <span><strong>{category.label}</strong><small>{category.english}</small></span>
                <b>{category.entries.length}</b>
              </button>
            )
          })}
        </nav>

        <nav className="tool-nav" aria-label="扩展工具">
          <span className="nav-label">扩展工具</span>
          <div className="tool-nav-list">
            <button className={`category-nav-item tool-nav-item tone-coral ${activeTool === 'rgba' ? 'is-active' : ''}`} type="button" onClick={() => chooseTool('rgba')}>
              <Wrench size={18} />
              <span><strong>RGBA 通道工具</strong><small>PACK / UNPACK</small></span>
              <b>TOOL</b>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <span>持续整理 / 2026</span>
          <a href={activePlatform === 'blender' ? blenderHome : notionHome} target="_blank" rel="noreferrer">原始 Notion <ExternalLink size={14} /></a>
        </div>
      </aside>
    </>
  )
}

function DetailDrawer({ entry, onClose, onImageOpen }) {
  const imageUrls = entry ? entryImageUrls(entry) : []

  useEffect(() => {
    if (!entry) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    document.body.classList.add('drawer-open')
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.classList.remove('drawer-open')
    }
  }, [entry, onClose])

  return (
    <div className={`detail-layer ${entry ? 'is-open' : ''}`} aria-hidden={!entry}>
      <button className="detail-backdrop" type="button" aria-label="关闭详情" onClick={onClose} tabIndex={entry ? 0 : -1} />
      <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={entry ? `${entry.title} 详情` : '条目详情'}>
        {entry && (
          <>
            <header className="detail-topbar">
              <span>{entry.categoryEnglish}</span>
              <button type="button" onClick={onClose} aria-label="关闭详情"><X size={20} /></button>
            </header>
            <div className="detail-index"><span>{entry.number}</span><i /></div>
            <div className="detail-media-list">
              {imageUrls.map((image, index) => (
                <button className="detail-media-trigger" type="button" onClick={() => onImageOpen(image, `${entry.title} 案例图 ${index + 1}`)} aria-label={`放大案例图 ${index + 1}`} key={image}>
                  <figure className="detail-media">
                    <img src={image} alt={`${entry.title} 案例图 ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
                    <span className="detail-media-hint">点击查看大图</span>
                  </figure>
                </button>
              ))}
            </div>
            <div className="detail-copy">
              <span className={`detail-category tone-text-${entry.tone}`}>{entry.category}</span>
              <h2>{entry.title}</h2>
              <p>{entry.note}</p>
              <div className="detail-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
            <div className="detail-source">
              <span>内容来源</span>
              <p>条目根据个人 Notion 记录整理，原页面可能包含案例图、安装包和补充说明。</p>
              <a href={entry.source} target="_blank" rel="noreferrer">查看原始记录 <ArrowUpRight size={17} /></a>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function ImageLightbox({ image, alt, onClose }) {
  useEffect(() => {
    if (!image) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    document.body.classList.add('lightbox-open')
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.classList.remove('lightbox-open')
    }
  }, [image, onClose])

  return (
    <div className={`lightbox-layer ${image ? 'is-open' : ''}`} aria-hidden={!image}>
      <button className="lightbox-backdrop" type="button" aria-label="关闭大图" onClick={onClose} tabIndex={image ? 0 : -1} />
      <div className="lightbox-content" role="dialog" aria-modal="true" aria-label={alt || '案例大图'}>
        {image && <img src={image} alt={alt || ''} decoding="async" />}
        <button className="lightbox-close" type="button" onClick={onClose} aria-label="关闭大图"><X size={22} /></button>
      </div>
    </div>
  )
}

function App() {
  const [activePlatform, setActivePlatform] = useState('all')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTool, setActiveTool] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const deferredQuery = useDeferredValue(query)
  const appRef = useRef(null)
  const heroArtRef = useRef(null)

  const activePlatformInfo = platforms.find((platform) => platform.id === activePlatform) || platforms[0]
  const visibleCategories = activePlatform === 'all'
    ? categories
    : categories.filter((category) => category.platform === activePlatform)
  const scopedEntries = useMemo(() => activePlatform === 'all'
    ? allEntries
    : allEntries.filter((entry) => entry.platform === activePlatform), [activePlatform])

  const filteredEntries = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase()
    return scopedEntries.filter((entry) => {
      const inCategory = activeCategory === 'all' || entry.categoryId === activeCategory
      const searchable = `${entry.title} ${entry.note} ${entry.category} ${entry.categoryEnglish} ${entry.platform} ${entry.tags.join(' ')}`.toLowerCase()
      return inCategory && (!normalized || searchable.includes(normalized))
    })
  }, [activeCategory, deferredQuery, scopedEntries])

  const activeCategoryInfo = categories.find((category) => category.id === activeCategory)
  const activeLabel = activeCategoryInfo?.label || activePlatformInfo.label
  const heroCopy = activePlatform === 'blender'
    ? {
        eyebrow: 'BLENDER / MATH / VECTOR / NOISE',
        summary: '从标量运算延伸到矢量方向与噪波位移，整理几何节点里可直接查用的关系和案例。',
        cover: `${assetBase}assets/blender/12-reflect-example-a.png`,
        caption: 'Blender 节点案例记录',
      }
    : activePlatform === 'ae'
      ? {
          eyebrow: 'AFTER EFFECTS / PLUGINS / WORKFLOW',
          summary: '围绕 After Effects 插件、脚本与画面处理整理的个人制作索引。',
          cover: `${assetBase}assets/knowledge-cover.jpg`,
          caption: 'After Effects 制作记录',
        }
      : {
          eyebrow: 'AFTER EFFECTS / BLENDER / WORKFLOW',
          summary: '把常用工具、节点逻辑与画面处理经验收进一套可检索的视效制作索引。',
          cover: `${assetBase}assets/knowledge-cover.jpg`,
          caption: '视效制作知识索引',
        }

  const choosePlatform = (platformId) => {
    setActivePlatform(platformId)
    setActiveCategory('all')
  }

  const activeToolLabel = 'RGBA 通道工具'

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'expo.out' } })
      if (window.matchMedia('(min-width: 901px)').matches) {
        timeline.fromTo('.sidebar', { x: -64, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1 })
      }
      timeline
        .fromTo('.utility-bar', { y: -30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.75 }, 0.18)
        .fromTo('.hero-eyebrow', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6 }, 0.34)
        .fromTo('.knowledge-title', { yPercent: 120, rotateX: -72, autoAlpha: 0 }, { yPercent: 0, rotateX: 0, autoAlpha: 1, duration: 1.05 }, 0.42)
        .fromTo('.hero-summary, .search-shell, .hero-stat', { y: 38, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08 }, 0.72)
        .fromTo('.hero-art', { clipPath: 'inset(0 0 100% 0)', scale: 1.08, autoAlpha: 0 }, { clipPath: 'inset(0 0 0% 0)', scale: 1, autoAlpha: 1, duration: 1.2 }, 0.55)
    }, appRef)
    return () => context.revert()
  }, [])

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined
    const context = gsap.context(() => {
      gsap.fromTo('.entry-card', { y: 42, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.68, stagger: 0.025, ease: 'power3.out', overwrite: true })
    }, appRef)
    return () => context.revert()
  }, [activeCategory, deferredQuery])

  useEffect(() => {
    const art = heroArtRef.current
    if (!art || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const xTo = gsap.quickTo(art, 'x', { duration: 0.8, ease: 'power3.out' })
    const yTo = gsap.quickTo(art, 'y', { duration: 0.8, ease: 'power3.out' })
    const move = (event) => {
      if (event.pointerType === 'touch') return
      xTo((event.clientX / window.innerWidth - 0.5) * 22)
      yTo((event.clientY / window.innerHeight - 0.5) * 16)
    }
    const reset = () => { xTo(0); yTo(0) }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerleave', reset)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerleave', reset)
    }
  }, [])

  return (
    <div className="knowledge-app" ref={appRef}>
      <BackgroundVideo />
      <AmbientField />
      <ScrollBlur />
      <Sidebar activePlatform={activePlatform} activeCategory={activeCategory} activeTool={activeTool} onPlatformChange={choosePlatform} onCategoryChange={setActiveCategory} onToolChange={setActiveTool} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="app-main">
        <header className="utility-bar">
          <button className="mobile-menu" type="button" onClick={() => setSidebarOpen(true)} aria-label="打开分类菜单"><Menu size={19} /></button>
          <div className="breadcrumb"><span>{activeTool ? 'EXTENSION TOOL' : 'FX NOTES'}</span><i /> <strong>{activeTool ? activeToolLabel : activeLabel}</strong></div>
          {activeTool ? <button className="source-link tool-back-link" type="button" onClick={() => setActiveTool(null)}>返回知识库 <ArrowUpRight size={16} /></button> : <a className="source-link" href={activePlatform === 'blender' ? blenderHome : notionHome} target="_blank" rel="noreferrer">NOTION SOURCE <ArrowUpRight size={16} /></a>}
        </header>

        {activeTool === 'rgba' ? <RgbaToolWorkspace /> : <>
        <section className="knowledge-hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">{heroCopy.eyebrow}</span>
            <h1 className="knowledge-title"><WarpText text="视效知识库" /></h1>
            <p className="hero-summary">{heroCopy.summary}</p>
            <label className="search-shell">
              <Search size={20} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索工具、节点或关键词" aria-label="搜索知识库" />
              <kbd>{filteredEntries.length}</kbd>
            </label>
            <div className="hero-stats">
              <div className="hero-stat"><strong>{scopedEntries.length}</strong><span>条记录<br />当前平台</span></div>
              <div className="hero-stat"><strong>{visibleCategories.length}</strong><span>个分类<br />知识分组</span></div>
              <div className="hero-stat"><strong>{activePlatformInfo.short}</strong><span>制作工具<br />{activePlatformInfo.label}</span></div>
            </div>
          </div>
          <div className="hero-art" ref={heroArtRef}>
            <img src={heroCopy.cover} alt={heroCopy.caption} fetchPriority="high" decoding="async" />
            <div className="hero-art-wash" />
            <span className="art-index">INDEX / {String(scopedEntries.length).padStart(3, '0')}</span>
            <span className="art-caption">{heroCopy.caption}</span>
          </div>
        </section>

        <section className="catalog" id="catalog">
          <div className="catalog-heading">
            <div><span>KNOWLEDGE INDEX</span><h2>{activeLabel}</h2></div>
            <p>当前显示 <strong>{filteredEntries.length}</strong> 条记录</p>
          </div>

          <div className="filter-strip" role="tablist" aria-label="快速分类筛选">
            <button className={activeCategory === 'all' ? 'is-active' : ''} type="button" onClick={() => setActiveCategory('all')}>全部</button>
            {visibleCategories.map((category) => <button className={activeCategory === category.id ? 'is-active' : ''} type="button" onClick={() => setActiveCategory(category.id)} key={category.id}>{category.label}</button>)}
          </div>

          {filteredEntries.length ? (
            <div className="entry-grid">
              {filteredEntries.map((entry) => (
                <button className={`entry-card tone-${entry.tone}`} type="button" onClick={() => setSelectedEntry(entry)} key={entry.id}>
                  <span className="entry-number">{entry.number}</span>
                  <span className="entry-media"><img src={entryPreviewUrl(entry)} alt="" loading="lazy" decoding="async" fetchPriority="low" /></span>
                  <span className="entry-category">{entry.category}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.note}</p>
                  <span className="entry-footer"><i>{entry.tags[0]}</i><ChevronRight size={18} /></span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Search size={26} /><h3>没有找到对应记录</h3><p>尝试使用工具名称、节点类型或其他关键词。</p><button type="button" onClick={() => setQuery('')}>清除搜索</button></div>
          )}
        </section>
        </>}

        <footer className="site-footer">
          <span>© 2026 王恩涛 / {activeTool ? '扩展工具' : '视效知识库'}</span>
          <span>{activeTool ? '本地纹理通道合并与拆分工具' : 'AE 与 Blender 制作经验索引'}</span>
          {activeTool ? <button className="footer-tool-link" type="button" onClick={() => setActiveTool(null)}>返回知识库 <ArrowUpRight size={14} /></button> : <a href={activePlatform === 'blender' ? blenderHome : notionHome} target="_blank" rel="noreferrer">NOTION <ArrowUpRight size={14} /></a>}
        </footer>
      </main>

      <DetailDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} onImageOpen={(image, alt) => setLightbox({ image, alt })} />
      <ImageLightbox image={lightbox?.image} alt={lightbox?.alt} onClose={() => setLightbox(null)} />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
