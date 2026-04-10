<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

interface Props {
  position: THREE.Vector3
  camera: THREE.PerspectiveCamera
  totalCredit: string
  totalPartners: number
}

const props = defineProps<Props>()

const labelRef = ref<HTMLDivElement>()
const isVisible = ref(true)

function updatePosition() {
  if (!labelRef.value) return

  const position = props.position.clone()
  position.y += 45
  position.project(props.camera)

  const x = (position.x * 0.5 + 0.5) * window.innerWidth
  const y = (-position.y * 0.5 + 0.5) * window.innerHeight - 20

  labelRef.value.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
  labelRef.value.style.opacity = position.z > 1 ? '0' : '1'
}

function animate() {
  updatePosition()
  requestAnimationFrame(animate)
}

onMounted(() => {
  animate()
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<template>
  <div
    v-if="isVisible"
    ref="labelRef"
    class="absolute pointer-events-none text-center -translate-x-1/2 -translate-y-full z-50 px-4 py-2.5 bg-orange-500/20 rounded-2xl border border-orange-500/40 backdrop-blur-md"
    style="will-change: transform, opacity;"
  >
    <span>
      <span class="inline-block w-2 h-2 bg-orange-500 rounded-full align-middle mr-1.5 shadow-[0_0_8px_#ff6b35]"></span>
      <span class="font-bold text-sm text-orange-500">核心主体</span>
    </span>
    <div class="w-full h-0.5 bg-orange-500 my-1.5"></div>
    <div class="flex justify-center gap-4 mt-1">
      <div class="text-xs text-gray-400">总授信 <span class="text-green-400">{{ totalCredit }}</span></div>
      <div class="text-xs text-gray-400">总合作量 <span class="text-green-400">{{ totalPartners }}家</span></div>
    </div>
  </div>
</template>
