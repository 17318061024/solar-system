import { ref } from 'vue'
import { useScene } from './useScene'
import { useCamera } from './useCamera'
import { useNodes } from './useNodes'
import { useParticles } from './useParticles'
import { useInteraction } from './useInteraction'
import { useLabels } from './useLabels'
import type { Institution, SolarSystemProps } from './types'

export type { Institution, SolarSystemProps }
export type { SolarSystemEmits, SolarSystemInst } from './types'

export function useSolarSystem(props: SolarSystemProps) {
  const containerRef = ref<HTMLDivElement | null>(null)
  const selectedInst = ref<Institution | null>(null)
  const hoveredInst = ref<Institution | null>(null)
  const currentRegion = ref<string>('global')

  let animationId = 0

  // Sub-composables (initialized in init())
  let sceneApi: ReturnType<typeof useScene> | null = null
  let cameraApi: ReturnType<typeof useCamera> | null = null
  let nodesApi: ReturnType<typeof useNodes> | null = null
  let particlesApi: ReturnType<typeof useParticles> | null = null
  let interactionApi: ReturnType<typeof useInteraction> | null = null
  let labelsApi: ReturnType<typeof useLabels> | null = null

  function init() {
    if (!containerRef.value) return

    // 1. Scene
    sceneApi = useScene({ containerRef, themeColor: props.themeColor })
    const sceneCtx = sceneApi.init()

    // 2. Camera
    cameraApi = useCamera({ camera: sceneCtx.camera, renderer: sceneCtx.renderer })

    // 3. Particles
    particlesApi = useParticles({ sceneCtx })

    // 4. Nodes
    nodesApi = useNodes({
      sceneCtx,
      props,
      selectedInst,
      hoveredInst,
      createTrailParticles: (sphere, inst) => particlesApi!.createTrailParticles(sphere, inst),
    })
    nodesApi.createAll()

    // 5. Interaction
    interactionApi = useInteraction({
      sceneCtx,
      isDragging: cameraApi.isDragging,
      coreSphere: nodesApi.coreSphere,
      nodeSpheres: nodesApi.nodeSpheres,
      selectedInst,
      hoveredInst,
    })

    // 6. Labels
    labelsApi = useLabels({
      sceneCtx,
      nodeSpheres: nodesApi.nodeSpheres,
      coreSphere: nodesApi.coreSphere,
    })
    labelsApi.createLabels(props.institutions)

    // Register event listeners
    const domEl = sceneCtx.renderer.domElement
    cameraApi.registerListeners()
    interactionApi.registerListeners()

    // Combined mousemove handler
    const onMouseMove = (e: MouseEvent) => {
      cameraApi!.handleDrag(e)
      if (!cameraApi!.isDragging.value) {
        interactionApi!.handleHover(e)
      }
    }
    domEl.addEventListener('mousemove', onMouseMove)

    // Store cleanup reference
    ;(init as { _cleanup?: () => void })._cleanup = () => {
      domEl.removeEventListener('mousemove', onMouseMove)
    }

    // 7. Start animation
    animate()
  }

  function animate() {
    animationId = requestAnimationFrame(animate)
    const time = Date.now()

    nodesApi?.updateAnimation(time)
    particlesApi?.updateAnimation()
    labelsApi?.updateLabels()

    // Update label extended state based on selection
    labelsApi?.setExtended(selectedInst.value?.name ?? null)

    sceneApi?.updateStarField()
    sceneApi?.render()
  }

  function setRegion(region: string) {
    currentRegion.value = region
    nodesApi?.setRegion(region)
    labelsApi?.setRegion(region)
    particlesApi?.clearParticlesForRegion()
  }

  function dispose() {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    labelsApi?.dispose()
    interactionApi?.dispose()
    cameraApi?.dispose()
    particlesApi?.dispose()
    nodesApi?.dispose()
    sceneApi?.dispose()
  }

  return {
    containerRef,
    selectedInst,
    hoveredInst,
    currentRegion,
    init,
    dispose,
    setRegion,
  }
}
