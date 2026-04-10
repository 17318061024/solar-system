import { computed, type Ref } from 'vue'
import * as THREE from 'three'
import type { SceneContext } from './useScene'
import type { SolarSystemProps, SolarSystemInst, Institution, NodeUserData, ConnectionLineUserData } from './types'
import { CORE_RADIUS, ORBIT_RADII, LAYER_Ys, ORBIT_SPEED, MAX_CONNECTION_POINTS } from './constants'

export function useNodes(ctx: {
  sceneCtx: SceneContext
  props: SolarSystemProps
  selectedInst: Ref<Institution | null>
  hoveredInst: Ref<Institution | null>
  createTrailParticles: (sphere: THREE.Mesh, inst: SolarSystemInst) => void
}) {
  let coreSphere!: THREE.Mesh
  let coreGlowRings: THREE.Mesh[] = []
  let nodeSpheres: THREE.Mesh[] = []
  let connectionLines: THREE.Group[] = []
  const pendingTimeouts: number[] = []

  const institutions = computed(() => {
    return ctx.props.institutions.map((inst, index) => ({
      ...inst,
      angle: (index / ctx.props.institutions.length) * Math.PI * 2,
      orbitRadius: ORBIT_RADII[index % 6],
      orbitY: LAYER_Ys[index % 5],
      curveHeight: index % 2 === 0 ? 40 : -20,
    }))
  })

  function createAll() {
    createCoreSphere()
    createCoreRings()
    createNodeSpheres()
  }

  function createCoreSphere() {
    const geometry = new THREE.SphereGeometry(CORE_RADIUS, 64, 64)
    const material = new THREE.MeshPhongMaterial({
      color: ctx.props.themeColor || 0xff6b35,
      emissive: ctx.props.themeColor || 0xff6b35,
      emissiveIntensity: 0.5,
      shininess: 60,
    })

    coreSphere = new THREE.Mesh(geometry, material)
    coreSphere.userData = { isCore: true }
    ctx.sceneCtx.scene.add(coreSphere)

    // Glow
    const glowGeo = new THREE.SphereGeometry(CORE_RADIUS + 8, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: ctx.props.themeColor || 0xff6b35,
      transparent: true,
      opacity: 0.2,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    coreSphere.add(glow)
    coreSphere.userData.glow = glow
  }

  function createCoreRings() {
    const coreColor = ctx.props.themeColor || 0xff6b35
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
      ctx.sceneCtx.scene.add(ring)
      coreGlowRings.push(ring)
    }
  }

  function createNodeSpheres() {
    institutions.value.forEach((inst) => {
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
        Math.cos(inst.angle) * inst.orbitRadius,
        inst.orbitY,
        Math.sin(inst.angle) * inst.orbitRadius,
      )
      sphere.userData = {
        inst,
        angle: inst.angle,
        baseSize: size,
        isSelected: false,
        isWarning: inst.level === 'warning' || inst.level === 'danger',
      } as NodeUserData

      ctx.sceneCtx.scene.add(sphere)
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
      ctx.sceneCtx.scene.add(glowRing)
      sphere.userData.glowRing = glowRing

      // Arc particles
      sphere.userData.arc = createArc(size)

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

  function createArc(size: number): THREE.Points {
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
    ctx.sceneCtx.scene.add(dotPoints)
    return dotPoints
  }

  function createConnectionLine(sphere: THREE.Mesh, inst: SolarSystemInst) {
    const timeoutId = window.setTimeout(() => {
      const startY = 0
      const midY = inst.curveHeight

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

      // Pre-allocate geometry
      const points = curve.getPoints(50)
      const positionsOuter = new Float32Array(MAX_CONNECTION_POINTS * 3)
      const positionsInner = new Float32Array(MAX_CONNECTION_POINTS * 3)
      for (let i = 0; i < points.length; i++) {
        positionsOuter[i * 3] = points[i].x
        positionsOuter[i * 3 + 1] = points[i].y
        positionsOuter[i * 3 + 2] = points[i].z
        positionsInner[i * 3] = points[i].x
        positionsInner[i * 3 + 1] = points[i].y
        positionsInner[i * 3 + 2] = points[i].z
      }

      const geoOuter = new THREE.BufferGeometry()
      geoOuter.setAttribute('position', new THREE.BufferAttribute(positionsOuter, 3))
      geoOuter.setDrawRange(0, points.length)

      const geoInner = new THREE.BufferGeometry()
      geoInner.setAttribute('position', new THREE.BufferAttribute(positionsInner, 3))
      geoInner.setDrawRange(0, points.length)

      const lineOuter = new THREE.Line(
        geoOuter,
        new THREE.LineBasicMaterial({
          color: lineColor,
          transparent: true,
          opacity: 0.35,
        }),
      )
      const lineInner = new THREE.Line(
        geoInner,
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
      } as ConnectionLineUserData

      ctx.sceneCtx.scene.add(lineGroup)
      connectionLines.push(lineGroup)

      // Particles
      ctx.createTrailParticles(sphere, inst)

      // Clean up from pending list
      const idx = pendingTimeouts.indexOf(timeoutId)
      if (idx !== -1) pendingTimeouts.splice(idx, 1)
    }, 50)
    pendingTimeouts.push(timeoutId)
  }

  function updateAnimation(time: number) {
    // Core rotation
    coreSphere.rotation.y += 0.003

    // Core rings
    coreGlowRings.forEach((ring) => {
      ring.rotation.z += ring.userData.speed
      ring.position.set(0, 0, 0)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = ring.userData.baseOpacity
    })

    // Core glow
    const glowMat = coreSphere.userData.glow.material as THREE.MeshBasicMaterial
    glowMat.opacity = 0.15 + Math.sin(time * 0.003) * 0.08

    // Nodes
    nodeSpheres.forEach((sphere, i) => {
      if (!sphere.visible) return

      const inst = sphere.userData.inst as SolarSystemInst
      const isSelected = ctx.selectedInst.value?.name === inst.name
      const isHovered = ctx.hoveredInst.value?.name === inst.name

      if (!isSelected && !isHovered) {
        sphere.userData.angle += ORBIT_SPEED
      }

      const ud = sphere.userData as NodeUserData
      sphere.position.set(
        Math.cos(ud.angle) * inst.orbitRadius,
        inst.orbitY + Math.sin(time * 0.002) * 3,
        Math.sin(ud.angle) * inst.orbitRadius,
      )

      sphere.scale.set(1, 1, 1)

      // Glow ring
      if (ud.glowRing) {
        ud.glowRing.position.copy(sphere.position)
        ud.glowRing.lookAt(ctx.sceneCtx.camera.position)
      }

      // Arc
      if (ud.arc) {
        ud.arc.position.copy(sphere.position)
        ud.arc.lookAt(ctx.sceneCtx.camera.position)
        ;(ud.arc.material as THREE.ShaderMaterial).uniforms.uTime.value = time * 0.001
      }

      // Ring
      if (isSelected || isHovered) {
        ;(ud.ring!.material as THREE.MeshBasicMaterial).opacity = isSelected ? 0.6 : 0.4
        ud.ring!.scale.set(1.15, 1.15, 1)
        if (sphere.material instanceof THREE.MeshPhongMaterial) {
          sphere.material.emissive.setHex(isSelected ? 0x444444 : 0x222222)
        }
      } else {
        ;(ud.ring!.material as THREE.MeshBasicMaterial).opacity = 0
        ud.ring!.scale.set(1, 1, 1)
        if (sphere.material instanceof THREE.MeshPhongMaterial) {
          sphere.material.emissive.setHex(0x000000)
        }
      }

      // Warning ring
      if (ud.isWarning && ud.warningRing) {
        if (isSelected || isHovered) {
          const flash = 0.5 + Math.sin(time * 0.01) * 0.5
          ;(ud.warningRing.material as THREE.MeshBasicMaterial).opacity = flash
          const scale = 1 + Math.sin(time * 0.008) * 0.15
          ud.warningRing.scale.set(scale, scale, 1)
        } else {
          ;(ud.warningRing.material as THREE.MeshBasicMaterial).opacity = 0
        }
      }

      // Update connection lines - pre-allocated geometry
      const lineGroup = connectionLines[i]
      if (!lineGroup || !lineGroup.visible) return

      const lineUd = lineGroup.userData as ConnectionLineUserData
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          sphere.position.x * 0.5,
          inst.curveHeight,
          sphere.position.z * 0.5,
        ),
        sphere.position.clone(),
      )
      const newPoints = curve.getPoints(50)

      for (let j = 0; j < newPoints.length; j++) {
        const outerPos = (lineGroup.children[0] as THREE.Line).geometry.getAttribute('position') as THREE.BufferAttribute
        const innerPos = (lineGroup.children[1] as THREE.Line).geometry.getAttribute('position') as THREE.BufferAttribute
        outerPos.setXYZ(j, newPoints[j].x, newPoints[j].y, newPoints[j].z)
        innerPos.setXYZ(j, newPoints[j].x, newPoints[j].y, newPoints[j].z)
        outerPos.needsUpdate = true
        innerPos.needsUpdate = true
      }
      lineUd.curve = curve
    })
  }

  function setRegion(region: string) {
    nodeSpheres.forEach((sphere, idx) => {
      const inst = sphere.userData.inst as SolarSystemInst
      const visible = region === 'global' || inst.region === region
      sphere.visible = visible
      connectionLines[idx].visible = visible

      const ud = sphere.userData as NodeUserData
      if (ud.glowRing) ud.glowRing.visible = visible
      if (ud.arc) ud.arc.visible = visible
      if (ud.ring) ud.ring.visible = visible
      if (ud.warningRing) ud.warningRing.visible = visible
    })
  }

  function dispose() {
    pendingTimeouts.forEach((id) => clearTimeout(id))
    pendingTimeouts.length = 0
  }

  return {
    coreSphere,
    nodeSpheres,
    connectionLines,
    institutions,
    createAll,
    updateAnimation,
    setRegion,
    dispose,
  }
}
