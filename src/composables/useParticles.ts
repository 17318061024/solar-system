import * as THREE from 'three'
import type { SceneContext } from './useScene'
import type { SolarSystemInst, TrailParticleGroup } from './types'
import { MAX_PARTICLES_PER_TRAIL } from './constants'

let sharedCircleTexture: THREE.CanvasTexture | null = null

function getCircleTexture(): THREE.CanvasTexture {
  if (!sharedCircleTexture) {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx2d = canvas.getContext('2d')!
    ctx2d.fillStyle = '#ffffff'
    ctx2d.beginPath()
    ctx2d.arc(32, 32, 32, 0, Math.PI * 2)
    ctx2d.fill()
    sharedCircleTexture = new THREE.CanvasTexture(canvas)
  }
  return sharedCircleTexture
}

export function useParticles(ctx: { sceneCtx: SceneContext }) {
  const lineParticles: TrailParticleGroup[] = []

  function createTrailParticles(sphere: THREE.Mesh, inst: SolarSystemInst) {
    const sphereColor = new THREE.Color(inst.color)
    lineParticles.push({
      sphere,
      particles: [],
      lastSpawnTime: 0,
      nextSpawnTime: 400 + Math.random() * 400,
      maxLife: 600,
      sphereColor: sphereColor,
    })
  }

  function updateAnimation() {
    const now = Date.now()

    lineParticles.forEach((data) => {
      if (!data.sphere.visible) return

      const sp = data.sphere.position
      const ud = data.sphere.userData
      const ang = ud.angle as number
      const radius = (ud.baseSize as number) || 15
      const dirX = Math.cos(ang)
      const dirZ = Math.sin(ang)

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
        const count = Math.min(data.particles.length, MAX_PARTICLES_PER_TRAIL)

        if (!data.particlesObj) {
          // First time: pre-allocate geometry
          const positions = new Float32Array(MAX_PARTICLES_PER_TRAIL * 3)
          const colors = new Float32Array(MAX_PARTICLES_PER_TRAIL * 3)

          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
          geometry.setDrawRange(0, 0)

          const material = new THREE.PointsMaterial({
            size: 3,
            map: getCircleTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.NormalBlending,
            depthWrite: false,
            sizeAttenuation: true,
          })

          data.particlesObj = new THREE.Points(geometry, material)
          ctx.sceneCtx.scene.add(data.particlesObj)

          // Store buffers for direct access
          data.posBuffer = positions
          data.colorBuffer = colors
        }

        // Update pre-allocated buffers
        const c = data.sphereColor
        for (let i = 0; i < count; i++) {
          const p = data.particles[i]
          data.posBuffer![i * 3] = p.x
          data.posBuffer![i * 3 + 1] = p.y
          data.posBuffer![i * 3 + 2] = p.z
          data.colorBuffer![i * 3] = c.r * 0.3 + 0.7
          data.colorBuffer![i * 3 + 1] = c.g * 0.3 + 0.7
          data.colorBuffer![i * 3 + 2] = c.b * 0.3 + 0.7
        }

        const posAttr = data.particlesObj.geometry.getAttribute('position') as THREE.BufferAttribute
        const colAttr = data.particlesObj.geometry.getAttribute('color') as THREE.BufferAttribute
        posAttr.needsUpdate = true
        colAttr.needsUpdate = true
        data.particlesObj.geometry.setDrawRange(0, count)
        data.particlesObj.visible = true
      } else if (data.particlesObj) {
        data.particlesObj.visible = false
      }
    })
  }

  function clearParticlesForRegion() {
    lineParticles.forEach((data) => {
      data.particles = []
    })
  }

  function dispose() {
    lineParticles.forEach((data) => {
      if (data.particlesObj) {
        ctx.sceneCtx.scene.remove(data.particlesObj)
        data.particlesObj.geometry.dispose()
        ;(data.particlesObj.material as THREE.PointsMaterial).dispose()
      }
      data.particles = []
    })
    lineParticles.length = 0

    if (sharedCircleTexture) {
      sharedCircleTexture.dispose()
      sharedCircleTexture = null
    }
  }

  return { lineParticles, createTrailParticles, updateAnimation, clearParticlesForRegion, dispose }
}
