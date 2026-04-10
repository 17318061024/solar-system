import { type Ref } from 'vue'
import * as THREE from 'three'
import type { SceneContext } from './useScene'
import type { Institution } from './types'

export function useInteraction(ctx: {
  sceneCtx: SceneContext
  isDragging: Readonly<Ref<boolean>>
  coreSphere: THREE.Mesh
  nodeSpheres: THREE.Mesh[]
  selectedInst: Ref<Institution | null>
  hoveredInst: Ref<Institution | null>
}) {
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  function handleHover(e: MouseEvent) {
    if (ctx.isDragging.value) return

    const container = ctx.sceneCtx.containerRef.value
    if (!container) return

    const rect = container.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, ctx.sceneCtx.camera)

    const visibleSpheres = ctx.nodeSpheres.filter((s) => s.visible)
    const hits = raycaster.intersectObjects([ctx.coreSphere, ...visibleSpheres])

    if (hits.length > 0) {
      const obj = hits[0].object
      ctx.sceneCtx.renderer.domElement.style.cursor = 'pointer'

      if (obj.userData.isCore) {
        const glow = obj.userData.glow as THREE.Mesh | undefined
        if (glow) {
          ;(glow.material as THREE.MeshBasicMaterial).opacity = 0.4
        }
      } else {
        ctx.hoveredInst.value = obj.userData.inst as Institution
      }
    } else {
      ctx.sceneCtx.renderer.domElement.style.cursor = 'default'
      ctx.hoveredInst.value = null
    }
  }

  function onClick() {
    if (ctx.hoveredInst.value) {
      ctx.selectedInst.value = ctx.hoveredInst.value
    } else {
      ctx.selectedInst.value = null
    }
  }

  function registerListeners() {
    ctx.sceneCtx.renderer.domElement.addEventListener('click', onClick)
  }

  function dispose() {
    ctx.sceneCtx.renderer.domElement.removeEventListener('click', onClick)
  }

  return { handleHover, registerListeners, dispose }
}
