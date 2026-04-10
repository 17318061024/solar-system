import { ref, computed, type Ref } from 'vue'
import * as THREE from 'three'

export interface Institution {
  name: string
  abbr: string
  category: 'large' | 'medium' | 'small'
  region: 'global' | 'apac' | 'emea' | 'amer'
  credit: string
  used: string
  rate: string
  level: 'normal' | 'warning' | 'danger'
  color: string
}

export interface SolarSystemProps {
  institutions: Institution[]
  width?: number | string
  height?: number | string
  themeColor?: string
}

export interface SolarSystemEmits {
  (e: 'node-click', institution: Institution): void
  (e: 'node-hover', institution: Institution | null): void
}

export interface SolarSystemInst extends Institution {
  angle?: number
  orbitRadius?: number
  orbitY?: number
  curveHeight?: number
}

const CORE_RADIUS = 35
const ORBIT_RADII = [130, 140, 150, 160, 170, 180]
const LAYER_Ys = [40, 20, 0, -20, -40]
const ORBIT_SPEED = (Math.PI * 2) / 10000

export function useSolarSystem(props: SolarSystemProps) {
  const containerRef = ref<HTMLDivElement | null>(null)
  const selectedInst = ref<Institution | null>(null)
  const hoveredInst = ref<Institution | null>(null)
  const currentRegion = ref<string>('global')

  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let coreSphere: THREE.Mesh
  let coreGlowRings: THREE.Mesh[] = []
  let nodeSpheres: THREE.Mesh[] = []
  let connectionLines: THREE.Group[] = []
  let lineParticles: ParticleData[] = []
  let nodeLabels: NodeLabelData[] = []
  let coreLabel: CoreLabelData | null = null
  let starField: THREE.Points | null = null

  interface ParticleData {
    sphere: THREE.Mesh
    particles: Particle[]
    lastSpawnTime: number
    nextSpawnTime: number
    maxLife: number
    sphereColor: THREE.Color
    particlesObj?: THREE.Points
  }

  interface Particle {
    x: number
    y: number
    z: number
    vx: number
    vy: number
    vz: number
    life: number
  }

  interface NodeLabelData {
    element: HTMLDivElement
    sphere: THREE.Mesh
    inst: Institution
    isExtended: boolean
  }

  interface CoreLabelData {
    element: HTMLDivElement
    sphere: THREE.Mesh
  }

  let animationId: number
  let isDragging = false
  let lastMouseX = 0
  let lastMouseY = 0
  let cameraAngleX = 0
  let cameraAngleY = 0.3

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const institutions = computed(() => {
    return props.institutions.map((inst, index) => ({
      ...inst,
      angle: (index / props.institutions.length) * Math.PI * 2,
      orbitRadius: ORBIT_RADII[index % 6],
      orbitY: LAYER_Ys[index % 5],
      curveHeight: index % 2 === 0 ? 40 : -20,
    }))
  })

  function init() {
    console.log('init called', containerRef.value)
    if (!containerRef.value) return

    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020208)

    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
    camera.position.set(0, 180, 420)
    camera.lookAt(0, 0, 0)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setClearColor(0x020208)
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.value.appendChild(renderer.domElement)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 1, 500)
    pointLight.position.set(50, 100, 100)
    scene.add(pointLight)

    // Star field
    createStarField()

    // Core sphere
    createCoreSphere()

    // Core rings
    createCoreRings()

    // Node spheres
    createNodeSpheres()

    // Events
    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false } as any)
    renderer.domElement.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)

    animate()
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

  function createCoreSphere() {
    const geometry = new THREE.SphereGeometry(CORE_RADIUS, 64, 64)
    const material = new THREE.MeshPhongMaterial({
      color: props.themeColor || 0xff6b35,
      emissive: props.themeColor || 0xff6b35,
      emissiveIntensity: 0.5,
      shininess: 60,
    })

    coreSphere = new THREE.Mesh(geometry, material)
    coreSphere.userData = { isCore: true }
    scene.add(coreSphere)

    // Glow
    const glowGeo = new THREE.SphereGeometry(CORE_RADIUS + 8, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: props.themeColor || 0xff6b35,
      transparent: true,
      opacity: 0.2,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    coreSphere.add(glow)
    coreSphere.userData.glow = glow
  }

  function createCoreRings() {
    const coreColor = props.themeColor || 0xff6b35
    const coreColorLight = 0xff8f5f
    const orbitRingColors = [coreColor, coreColorLight]
    const orbitRingRadii = [130, 185]

    for (let i = 0; i < 2; i++) {
      const ringGeo = new THREE.RingGeometry(
        orbitRingRadii[i] - 1,
        orbitRingRadii[i] + 1,
        128,
      )
      const ringMat = new THREE.MeshBasicMaterial({
        color: orbitRingColors[i],
        transparent: true,
        opacity: i === 0 ? 0.5 : 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.userData = {
        baseOpacity: i === 0 ? 0.15 : 0.08,
        index: i,
        speed: 0.0003 + i * 0.0002,
      }
      scene.add(ring)
      coreGlowRings.push(ring)
    }
  }

  function createNodeSpheres() {
    institutions.value.forEach((inst, index) => {
      const size = inst.category === 'large' ? 10 : inst.category === 'medium' ? 8 : 6
      const color = new THREE.Color(inst.color)

      const geometry = new THREE.SphereGeometry(size, 32, 32)
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        shininess: 60,
      })

      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(
        Math.cos(inst.angle!) * inst.orbitRadius!,
        inst.orbitY!,
        Math.sin(inst.angle!) * inst.orbitRadius!,
      )
      sphere.userData = {
        inst,
        angle: inst.angle,
        baseSize: size,
        isSelected: false,
        isWarning: inst.level === 'warning' || inst.level === 'danger',
      }

      scene.add(sphere)
      nodeSpheres.push(sphere)

      // Glow ring
      const glowRingGeo = new THREE.RingGeometry(size, size + 2.5, 64)
      const glowRingMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat)
      scene.add(glowRing)
      sphere.userData.glowRing = glowRing

      // Arc particles
      const createArc = () => {
        const dotCount = 150
        const dotPositions = new Float32Array(dotCount * 3)
        const dotData = new Float32Array(dotCount)

        for (let i = 0; i < dotCount; i++) {
          const angle = Math.PI + (Math.PI * i) / dotCount
          const radius = size + 4
          dotPositions[i * 3] = Math.cos(angle) * radius
          dotPositions[i * 3 + 1] = Math.sin(angle) * radius
          dotPositions[i * 3 + 2] = 0
          dotData[i] = i / dotCount
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3))
        geometry.setAttribute('aData', new THREE.BufferAttribute(dotData, 1))

        const vertexShader = `
          attribute float aData;
          varying float vData;
          uniform float uTime;
          uniform float uRadius;
          void main() {
            vData = aData;
            float angle = aData * 3.14159 - uTime * 3.14159;
            float newAngle = 3.14159 + angle;
            newAngle = mod(newAngle, 6.28318);
            vec3 pos = vec3(cos(newAngle) * uRadius, sin(newAngle) * uRadius, 0.0);
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            float baseSize = 5.0 - aData * 3.5;
            gl_PointSize = max(baseSize, 1.5) * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `

        const fragmentShader = `
          varying float vData;
          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            if (dist > 0.5) discard;
            float alpha = 1.0 - vData * vData;
            alpha = pow(alpha, 0.6);
            float softness = 1.0 - smoothstep(0.3, 0.5, dist);
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * softness * 2.0);
          }
        `

        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uRadius: { value: size + 4 },
          },
        })

        const dotPoints = new THREE.Points(geometry, material)
        scene.add(dotPoints)
        return dotPoints
      }

      sphere.userData.arc = createArc()

      // Ring
      const ringGeo = new THREE.TorusGeometry(size * 1.6, 1.2, 16, 48)
      const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      sphere.add(ring)
      sphere.userData.ring = ring

      // Warning ring
      if (inst.level === 'warning' || inst.level === 'danger') {
        const warningRing = new THREE.Mesh(
          new THREE.TorusGeometry(size * 2.2, 1.5, 16, 48),
          new THREE.MeshBasicMaterial({
            color: 0xff3333,
            transparent: true,
            opacity: 0,
          }),
        )
        warningRing.rotation.x = Math.PI / 2
        sphere.add(warningRing)
        sphere.userData.warningRing = warningRing
      }

      // Connection line
      createConnectionLine(sphere, inst)
    })
  }

  function createConnectionLine(sphere: THREE.Mesh, inst: SolarSystemInst) {
    setTimeout(() => {
      const startY = 0
      const midY = inst.curveHeight!

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, startY, 0),
        new THREE.Vector3(
          sphere.position.x * 0.5,
          midY,
          sphere.position.z * 0.5,
        ),
        sphere.position.clone(),
      )

      const lineColor = new THREE.Color(inst.color)
      const lineOuter = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)),
        new THREE.LineBasicMaterial({
          color: lineColor,
          transparent: true,
          opacity: 0.35,
        }),
      )
      const lineInner = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)),
        new THREE.LineBasicMaterial({
          color: lineColor,
          transparent: true,
          opacity: 0.7,
        }),
      )

      const lineGroup = new THREE.Group()
      lineGroup.add(lineOuter)
      lineGroup.add(lineInner)
      lineGroup.userData = {
        inst,
        baseOpacity: 0.35,
        sphereColor: inst.color,
        curve: curve,
        sphereRef: sphere,
      }

      scene.add(lineGroup)
      connectionLines.push(lineGroup)

      // Particles
      createTrailParticles(sphere, inst)
    }, 50)
  }

  function createTrailParticles(sphere: THREE.Mesh, inst: SolarSystemInst) {
    const sphereColor = new THREE.Color(inst.color)
    const data = {
      sphere,
      particles: [],
      lastSpawnTime: 0,
      nextSpawnTime: 400 + Math.random() * 400,
      maxLife: 600,
      sphereColor: sphereColor,
    }

    lineParticles.push(data)
  }

  function onMouseDown(e: MouseEvent) {
    isDragging = true
    lastMouseX = e.clientX
    lastMouseY = e.clientY
  }

  function onMouseUp() {
    isDragging = false
  }

  function onClick(e: MouseEvent) {
    if (hoveredInst.value) {
      selectedInst.value = hoveredInst.value
    } else {
      selectedInst.value = null
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (isDragging) {
      const dx = e.clientX - lastMouseX
      const dy = e.clientY - lastMouseY
      cameraAngleX += dx * 0.005
      cameraAngleY = Math.max(-0.2, Math.min(0.7, cameraAngleY + dy * 0.005))
      const r = 450
      camera.position.set(
        Math.sin(cameraAngleX) * r * Math.cos(cameraAngleY),
        Math.sin(cameraAngleY) * r,
        Math.cos(cameraAngleX) * r * Math.cos(cameraAngleY),
      )
      camera.lookAt(0, 0, 0)
      lastMouseX = e.clientX
      lastMouseY = e.clientY
      return
    }

    if (!containerRef.value) return

    const rect = containerRef.value.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    const visibleSpheres = nodeSpheres.filter((s) => s.visible)
    const hits = raycaster.intersectObjects([coreSphere, ...visibleSpheres])

    if (hits.length > 0) {
      const obj = hits[0].object
      renderer.domElement.style.cursor = 'pointer'

      if (obj.userData.isCore) {
        if (coreSphere.userData.glow) {
          coreSphere.userData.glow.material.opacity = 0.4
        }
      } else {
        hoveredInst.value = obj.userData.inst
      }
    } else {
      renderer.domElement.style.cursor = 'default'
      hoveredInst.value = null
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    camera.position.multiplyScalar(e.deltaY > 0 ? 1.08 : 0.92)
    camera.position.clampLength(200, 800)
  }

  function onResize() {
    if (!containerRef.value) return
    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  function animate() {
    animationId = requestAnimationFrame(animate)
    const time = Date.now()

    // Core rotation
    coreSphere.rotation.y += 0.003

    // Core rings
    coreGlowRings.forEach((ring) => {
      ring.rotation.z += ring.userData.speed
      ring.position.set(0, 0, 0)
      ring.material.opacity = ring.userData.baseOpacity
    })

    // Core glow
    coreSphere.userData.glow.material.opacity = 0.15 + Math.sin(time * 0.003) * 0.08

    // Nodes
    nodeSpheres.forEach((sphere) => {
      if (!sphere.visible) return

      const inst = sphere.userData.inst as Institution
      const isSelected = selectedInst.value?.name === inst.name
      const isHovered = hoveredInst.value?.name === inst.name

      if (!isSelected && !isHovered) {
        sphere.userData.angle! += ORBIT_SPEED
      }

      sphere.position.set(
        Math.cos(sphere.userData.angle!) * inst.orbitRadius!,
        inst.orbitY! + Math.sin(time * 0.002) * 3,
        Math.sin(sphere.userData.angle!) * inst.orbitRadius!,
      )

      sphere.scale.set(1, 1, 1)

      // Glow ring
      if (sphere.userData.glowRing) {
        sphere.userData.glowRing.position.copy(sphere.position)
        sphere.userData.glowRing.lookAt(camera.position)
      }

      // Arc
      if (sphere.userData.arc) {
        const arc = sphere.userData.arc
        arc.position.copy(sphere.position)
        arc.lookAt(camera.position)
        arc.material.uniforms.uTime.value = time * 0.001
      }

      // Ring
      if (isSelected || isHovered) {
        sphere.userData.ring.material.opacity = isSelected ? 0.6 : 0.4
        sphere.userData.ring.scale.set(1.15, 1.15, 1)
        if (sphere.material.emissive) {
          sphere.material.emissive.setHex(isSelected ? 0x444444 : 0x222222)
        }
      } else {
        sphere.userData.ring.material.opacity = 0
        sphere.userData.ring.scale.set(1, 1, 1)
        if (sphere.material.emissive) {
          sphere.material.emissive.setHex(0x000000)
        }
      }

      // Warning ring
      if (sphere.userData.isWarning && sphere.userData.warningRing) {
        if (isSelected || isHovered) {
          const flash = 0.5 + Math.sin(time * 0.01) * 0.5
          sphere.userData.warningRing.material.opacity = flash
          const scale = 1 + Math.sin(time * 0.008) * 0.15
          sphere.userData.warningRing.scale.set(scale, scale, 1)
        } else {
          sphere.userData.warningRing.material.opacity = 0
        }
      }
    })

    // Connection lines
    connectionLines.forEach((lineGroup) => {
      const sphere = lineGroup.userData.sphereRef as THREE.Mesh
      lineGroup.visible = sphere.visible

      if (!sphere.visible) return

      const curve = lineGroup.userData.curve as THREE.QuadraticBezierCurve3
      const points = curve.getPoints(50)
      ;(lineGroup.children[0] as THREE.Line).geometry.dispose()
      ;(lineGroup.children[0] as THREE.Line).geometry =
        new THREE.BufferGeometry().setFromPoints(points)
      ;(lineGroup.children[1] as THREE.Line).geometry.dispose()
      ;(lineGroup.children[1] as THREE.Line).geometry =
        new THREE.BufferGeometry().setFromPoints(points)
    })

    // Particles
    updateLineParticles()

    // Star field rotation
    if (starField) {
      starField.rotation.y += 0.0001
      starField.rotation.x += 0.00005
    }

    renderer.render(scene, camera)
  }

  function updateLineParticles() {
    const now = Date.now()

    lineParticles.forEach((data) => {
      if (!data.sphere.visible) return

      const sp = data.sphere.position
      const ang = data.sphere.userData.angle
      const sphere = data.sphere
      const radius = sphere.userData.baseSize || 15
      const dirX = Math.cos(ang!)
      const dirZ = Math.sin(ang!)

      if (now > data.nextSpawnTime) {
        data.lastSpawnTime = now
        data.nextSpawnTime = now + 400 + Math.random() * 400

        data.particles.push({
          x: sp.x + dirX * (radius + 2),
          y: sp.y + 2,
          z: sp.z + dirZ * (radius + 2),
          vx: dirX * 0.15,
          vy: 0,
          vz: dirZ * 0.15,
          life: data.maxLife,
        })
      }

      for (let i = data.particles.length - 1; i >= 0; i--) {
        const p = data.particles[i]
        p.x += p.vx
        p.y += p.vy
        p.z += p.vz
        p.life--

        if (p.life <= 0) {
          data.particles.splice(i, 1)
        }
      }

      if (data.particles.length > 0) {
        const positions = new Float32Array(data.particles.length * 3)
        const colors = new Float32Array(data.particles.length * 3)

        data.particles.forEach((p: Particle, i: number) => {
          positions[i * 3] = p.x
          positions[i * 3 + 1] = p.y
          positions[i * 3 + 2] = p.z

          const c = data.sphereColor
          colors[i * 3] = c.r * 0.3 + 0.7
          colors[i * 3 + 1] = c.g * 0.3 + 0.7
          colors[i * 3 + 2] = c.b * 0.3 + 0.7
        })

        if (!data.particlesObj) {
          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

          const createCircleTexture = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 64
            canvas.height = 64
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.arc(32, 32, 32, 0, Math.PI * 2)
            ctx.fill()
            return new THREE.CanvasTexture(canvas)
          }

          const material = new THREE.PointsMaterial({
            size: 3,
            map: createCircleTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.NormalBlending,
            depthWrite: false,
            sizeAttenuation: true,
          })

          data.particlesObj = new THREE.Points(geometry, material)
          scene.add(data.particlesObj)
          data.particlesObj.visible = true
        } else {
          data.particlesObj.geometry.dispose()
          data.particlesObj.geometry = new THREE.BufferGeometry()
          data.particlesObj.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3),
          )
          data.particlesObj.geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(colors, 3),
          )
          data.particlesObj.visible = true
        }
      } else if (data.particlesObj) {
        data.particlesObj.visible = false
      }
    })
  }

  function setRegion(region: string) {
    currentRegion.value = region

    nodeSpheres.forEach((sphere, i) => {
      const inst = sphere.userData.inst as Institution
      const visible = region === 'global' || inst.region === region
      sphere.visible = visible
      connectionLines[i].visible = visible
      lineParticles[i].particles = []
      if (lineParticles[i].particlesObj) {
        lineParticles[i].particlesObj.visible = visible
      }

      if (sphere.userData.glowRing) sphere.userData.glowRing.visible = visible
      if (sphere.userData.arc) sphere.userData.arc.visible = visible
      if (sphere.userData.ring) sphere.userData.ring.visible = visible
      if (sphere.userData.warningRing) sphere.userData.warningRing.visible = visible
    })
  }

  function dispose() {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    window.removeEventListener('resize', onResize)
    renderer.domElement.removeEventListener('mousedown', onMouseDown)
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('mouseup', onMouseUp)
    renderer.domElement.removeEventListener('wheel', onWheel as any)
    renderer.domElement.removeEventListener('click', onClick)

    if (containerRef.value && renderer.domElement) {
      containerRef.value.removeChild(renderer.domElement)
    }

    renderer.dispose()
  }

  return {
    containerRef,
    selectedInst,
    hoveredInst,
    currentRegion,
    camera,
    coreSphere,
    init,
    dispose,
    setRegion,
  }
}