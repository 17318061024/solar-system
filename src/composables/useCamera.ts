import { ref } from 'vue'
import { CAMERA_DISTANCE, CAMERA_MIN_DIST, CAMERA_MAX_DIST } from './constants'
import type { SceneContext } from './useScene'

export function useCamera(ctx: {
  camera: SceneContext['camera']
  renderer: SceneContext['renderer']
}) {
  const isDragging = ref(false)
  let lastMouseX = 0
  let lastMouseY = 0
  let cameraAngleX = 0
  let cameraAngleY = 0.3

  function onMouseDown(e: MouseEvent) {
    isDragging.value = true
    lastMouseX = e.clientX
    lastMouseY = e.clientY
  }

  function onMouseUp() {
    isDragging.value = false
  }

  function handleDrag(e: MouseEvent) {
    if (!isDragging.value) return
    const dx = e.clientX - lastMouseX
    const dy = e.clientY - lastMouseY
    cameraAngleX += dx * 0.005
    cameraAngleY = Math.max(-0.2, Math.min(0.7, cameraAngleY + dy * 0.005))
    const r = CAMERA_DISTANCE
    ctx.camera.position.set(
      Math.sin(cameraAngleX) * r * Math.cos(cameraAngleY),
      Math.sin(cameraAngleY) * r,
      Math.cos(cameraAngleX) * r * Math.cos(cameraAngleY),
    )
    ctx.camera.lookAt(0, 0, 0)
    lastMouseX = e.clientX
    lastMouseY = e.clientY
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    ctx.camera.position.multiplyScalar(e.deltaY > 0 ? 1.08 : 0.92)
    ctx.camera.position.clampLength(CAMERA_MIN_DIST, CAMERA_MAX_DIST)
  }

  function registerListeners() {
    ctx.renderer.domElement.addEventListener('mousedown', onMouseDown)
    ctx.renderer.domElement.addEventListener('mouseup', onMouseUp)
    ctx.renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
  }

  function dispose() {
    ctx.renderer.domElement.removeEventListener('mousedown', onMouseDown)
    ctx.renderer.domElement.removeEventListener('mouseup', onMouseUp)
    ctx.renderer.domElement.removeEventListener('wheel', onWheel)
  }

  return { isDragging, handleDrag, registerListeners, dispose }
}
