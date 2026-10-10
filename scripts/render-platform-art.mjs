import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'

// Render once at authoring time; the website only loads the resulting WebP files.
const { chromium } = await import(process.argv[2] || 'playwright')
const { default: sharp } = await import(process.argv[3] || 'sharp')
const requestedPlatform = process.argv[4]
const platforms = ['blender', 'blender-material', 'ue']
assert(!requestedPlatform || platforms.includes(requestedPlatform), 'Unknown artwork platform')
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
await mkdir('public/assets/platforms', { recursive: true })
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } })
  await page.goto('http://127.0.0.1:5173/scripts/artwork-preview.html')
  for (const platform of requestedPlatform ? [requestedPlatform] : platforms) {
    const pixels = await page.evaluate(async (platform) => {
      const THREE = await import('/node_modules/three/build/three.module.js')
      const { RoomEnvironment } = await import('/node_modules/three/examples/jsm/environments/RoomEnvironment.js')
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
      renderer.setSize(960, 600)
      renderer.setPixelRatio(1)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      document.body.replaceChildren(renderer.domElement)
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#0d2021')
      scene.fog = new THREE.Fog('#0d2021', 12, 24)
      const pmrem = new THREE.PMREMGenerator(renderer)
      const environment = new RoomEnvironment()
      const target = pmrem.fromScene(environment, .04)
      scene.environment = target.texture
      scene.environmentIntensity = .75
      const camera = new THREE.PerspectiveCamera(32, 960 / 600, .1, 40)
      camera.position.set(7, 6, 8)
      camera.lookAt(0, .4, 0)
      scene.add(new THREE.HemisphereLight('#e9f1e6', '#123431', 2))
      const key = new THREE.DirectionalLight('#fff2dd', 4)
      key.position.set(-3, 8, 4)
      key.castShadow = true
      key.shadow.mapSize.set(2048, 2048)
      Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 })
      key.shadow.bias = -.001
      scene.add(key)
      const rim = new THREE.DirectionalLight('#a7e3d7', 3)
      rim.position.set(4, 3, -5)
      scene.add(rim)
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#142e2d', roughness: .85 }))
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -.65
      floor.receiveShadow = true
      scene.add(floor)
      const grid = new THREE.GridHelper(30, 60, '#45625a', '#29433e')
      grid.position.y = -.64
      grid.material.transparent = true
      grid.material.opacity = .4
      scene.add(grid)
      const addMesh = (geometry, material, position) => {
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(...position)
        mesh.castShadow = true
        mesh.receiveShadow = true
        scene.add(mesh)
        return mesh
      }
      if (platform === 'blender') {
        const geometry = new THREE.BoxGeometry(.53, .53, .53)
        const material = new THREE.MeshStandardMaterial({ color: '#b9cbb8', metalness: .12, roughness: .42 })
        const selected = new THREE.MeshStandardMaterial({ color: '#d49a65', metalness: .18, roughness: .35 })
        for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) {
          const y = .22 + .9 * Math.cos(x * .55) * Math.cos(z * .6)
          const mesh = addMesh(geometry, x === 0 ? selected : material, [x * .72, y, z * .72])
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: x === 0 ? '#ffe0a8' : '#5e8c82', transparent: true, opacity: .7 }))
          mesh.add(edges)
        }
        camera.position.set(7.8, 7.2, 8.4)
        camera.lookAt(0, .3, 0)
      } else if (platform === 'blender-material') {
        const { RoundedBoxGeometry } = await import('/node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js')
        grid.visible = false
        camera.position.set(5.3, 3.4, 7.5)
        camera.lookAt(0, .35, 0)
        key.intensity = 3
        rim.color.set('#c7e0dc')
        scene.environmentIntensity = 1
        floor.material.color.set('#253634')

        const textureSize = 512
        const weave = new Uint8Array(textureSize * textureSize * 4)
        const checker = new Uint8Array(textureSize * textureSize * 4)
        for (let y = 0; y < textureSize; y++) for (let x = 0; x < textureSize; x++) {
          const index = (y * textureSize + x) * 4
          const fiber = Math.sin(x * Math.PI / 4) * Math.sin(y * Math.PI / 4)
          const grain = Math.sin(x * 11.73 + y * 27.19) * .12
          const value = Math.round(128 + fiber * 64 + grain * 32)
          weave.set([value, value, value, 255], index)
          const light = (Math.floor(x / 64) + Math.floor(y / 64)) % 2 === 0
          checker.set(light ? [230, 219, 193, 255] : [74, 115, 108, 255], index)
        }
        const bumpMap = new THREE.DataTexture(weave, textureSize, textureSize)
        bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping
        bumpMap.repeat.set(3, 3)
        bumpMap.needsUpdate = true
        const colorMap = new THREE.DataTexture(checker, textureSize, textureSize)
        colorMap.colorSpace = THREE.SRGBColorSpace
        colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping
        colorMap.minFilter = THREE.LinearMipmapLinearFilter
        colorMap.magFilter = THREE.LinearFilter
        colorMap.generateMipmaps = true
        colorMap.needsUpdate = true

        const pedestal = new THREE.MeshStandardMaterial({ color: '#394b44', roughness: .78 })
        addMesh(new THREE.CylinderGeometry(1.48, 1.48, .26, 96), pedestal, [-.65, -.51, -.35])
        const cube = addMesh(new RoundedBoxGeometry(1.6, 1.6, 1.6, 4, .06), new THREE.MeshPhysicalMaterial({ color: '#527877', roughness: .54, sheen: .8, sheenColor: '#b1c9c4', bumpMap, bumpScale: .055 }), [-.65, .42, -.35])
        cube.rotation.y = -.22
        addMesh(new THREE.CylinderGeometry(.62, .62, .18, 72), pedestal, [1.25, -.55, .75])
        addMesh(new THREE.SphereGeometry(.56, 72, 48), new THREE.MeshPhysicalMaterial({ map: colorMap, roughness: .17, clearcoat: 1, clearcoatRoughness: .1 }), [1.25, .1, .75])
        addMesh(new THREE.CylinderGeometry(.49, .49, .16, 64), pedestal, [-1.45, -.56, 1.4])
        addMesh(new THREE.CylinderGeometry(.36, .36, .86, 72), new THREE.MeshPhysicalMaterial({ color: '#c18c53', metalness: 1, roughness: .2, clearcoat: .25 }), [-1.45, -.05, 1.4])
      } else {
        camera.position.set(5, 3.6, 7.5)
        camera.lookAt(0, .4, 0)
        const standMaterial = new THREE.MeshStandardMaterial({ color: '#2c4945', metalness: .35, roughness: .55 })
        addMesh(new THREE.CylinderGeometry(1.42, 1.5, .22, 96), standMaterial, [.2, -.52, 0])
        const ball = addMesh(new THREE.SphereGeometry(1.15, 96, 64), new THREE.MeshPhysicalMaterial({ color: '#548e80', metalness: .8, roughness: .23, clearcoat: .7, clearcoatRoughness: .15 }), [.2, .74, 0])
        const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(1.156, 24, 12)), new THREE.LineBasicMaterial({ color: '#cce7c7', transparent: true, opacity: .14 }))
        ball.add(wire)
        addMesh(new THREE.SphereGeometry(.5, 48, 32), new THREE.MeshStandardMaterial({ color: '#e1d9bc', roughness: .83, metalness: .05 }), [-1.6, -.13, .38])
        addMesh(new THREE.SphereGeometry(.4, 48, 32), new THREE.MeshStandardMaterial({ color: '#bc8850', roughness: .22, metalness: .85 }), [1.64, -.24, .7])
      }
      renderer.render(scene, camera)
      const context = renderer.getContext()
      const pixels = new Uint8Array(960 * 600 * 4)
      context.readPixels(0, 0, 960, 600, context.RGBA, context.UNSIGNED_BYTE, pixels)
      const colors = new Set()
      for (let i = 0; i < pixels.length; i += 400) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`)
      return colors.size
    }, platform)
    assert(pixels > 100, `${platform} render is blank`)
    await sharp(await page.locator('canvas').screenshot()).webp({ quality: 86 }).toFile(`public/assets/platforms/${platform}.webp`)
    console.log(`${platform}: ${pixels} sampled colors`)
    await page.reload()
  }
  if (!requestedPlatform) await sharp('public/assets/knowledge-cover.jpg').resize(960, 600, { fit: 'cover' }).webp({ quality: 84 }).toFile('public/assets/platforms/ae.webp')
} finally {
  await browser.close()
}
