import React, { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Aperture,
  ArrowUpRight,
  BookOpen,
  Box,
  Braces,
  ChevronRight,
  CircleDot,
  ExternalLink,
  Layers3,
  Menu,
  Search,
  Sparkles,
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

function Sidebar({ activePlatform, activeCategory, onPlatformChange, onCategoryChange, open, onClose }) {
  const visibleCategories = activePlatform === 'all'
    ? categories
    : categories.filter((category) => category.platform === activePlatform)

  const choosePlatform = (platformId) => {
    onPlatformChange(platformId)
    onClose()
  }

  const chooseCategory = (categoryId) => {
    onCategoryChange(categoryId)
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
        eyebrow: 'BLENDER / GEOMETRY NODES / NOTES',
        summary: '把几何节点中的运算关系、曲线逻辑和案例整理成可复用的制作索引。',
        cover: `${assetBase}assets/blender/07-repeat-example.png`,
        caption: '几何节点案例记录',
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
      <Sidebar activePlatform={activePlatform} activeCategory={activeCategory} onPlatformChange={choosePlatform} onCategoryChange={setActiveCategory} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="app-main">
        <header className="utility-bar">
          <button className="mobile-menu" type="button" onClick={() => setSidebarOpen(true)} aria-label="打开分类菜单"><Menu size={19} /></button>
          <div className="breadcrumb"><span>FX NOTES</span><i /> <strong>{activeLabel}</strong></div>
          <a className="source-link" href={activePlatform === 'blender' ? blenderHome : notionHome} target="_blank" rel="noreferrer">NOTION SOURCE <ArrowUpRight size={16} /></a>
        </header>

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

        <footer className="site-footer">
          <span>© 2026 王恩涛 / 视效知识库</span>
          <span>AE 与 Blender 制作经验索引</span>
          <a href={activePlatform === 'blender' ? blenderHome : notionHome} target="_blank" rel="noreferrer">NOTION <ArrowUpRight size={14} /></a>
        </footer>
      </main>

      <DetailDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} onImageOpen={(image, alt) => setLightbox({ image, alt })} />
      <ImageLightbox image={lightbox?.image} alt={lightbox?.alt} onClose={() => setLightbox(null)} />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
