import { type Ref } from 'vue'
import * as THREE from 'three'

export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  containerRef: Ref<HTMLDivElement | null>
}

export function useScene(ctx: {
  containerRef: Ref<HTMLDivElement | null>
  themeColor?: string
}) {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let starField: THREE.Points | null = null

  function init(): SceneContext {
    if (!ctx.containerRef.value) throw new Error('Container not ready')

    const width = ctx.containerRef.value.clientWidth
    const height = ctx.containerRef.value.clientHeight

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020208)

    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
    camera.position.set(0, 180, 420)
    camera.lookAt(0, 0, 0)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setClearColor(0x020208)
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    ctx.containerRef.value.appendChild(renderer.domElement)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 1, 500)
    pointLight.position.set(50, 100, 100)
    scene.add(pointLight)

    createStarField()

    window.addEventListener('resize', onResize)

    return { scene, camera, renderer, containerRef: ctx.containerRef }
  }

  function createStarField() {
    const count = 5000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const r = 600 + Math.random() * 600
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const colorType = Math.random()
      const brightness = 0.4 + Math.random() * 0.6
      if (colorType < 0.6) {
        colors[i * 3] = brightness
        colors[i * 3 + 1] = brightness
        colors[i * 3 + 2] = brightness
      } else if (colorType < 0.8) {
        colors[i * 3] = brightness * 0.7
        colors[i * 3 + 1] = brightness * 0.8
        colors[i * 3 + 2] = brightness
      } else {
        colors[i * 3] = brightness
        colors[i * 3 + 1] = brightness * 0.9
        colors[i * 3 + 2] = brightness * 0.6
      }

      sizes[i] = 0.5 + Math.random() * 2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    })

    starField = new THREE.Points(geometry, material)
    scene.add(starField)
  }

  function updateStarField() {
    if (starField) {
      starField.rotation.y += 0.0001
      starField.rotation.x += 0.00005
    }
  }

  function onResize() {
    if (!ctx.containerRef.value) return
    const width = ctx.containerRef.value.clientWidth
    const height = ctx.containerRef.value.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  function render() {
    renderer.render(scene, camera)
  }

  function dispose() {
    window.removeEventListener('resize', onResize)
    if (ctx.containerRef.value && renderer.domElement) {
      ctx.containerRef.value.removeChild(renderer.domElement)
    }
    renderer.dispose()
  }

  return { init, updateStarField, render, dispose }
}
