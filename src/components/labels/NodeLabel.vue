<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import type { Institution } from '../../composables/useSolarSystem'

interface Props {
  institution: Institution
  position: THREE.Vector3
  camera: THREE.PerspectiveCamera
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
})

const labelRef = ref<HTMLDivElement>()
const isExtended = computed(() => props.isSelected)

function updatePosition() {
  if (!labelRef.value) return

  const offsetY = props.isSelected ? 40 : 20
  const position = props.position.clone()
  position.y += offsetY
  position.project(props.camera)

  const x = (position.x * 0.5 + 0.5) * window.innerWidth
  const y = (-position.y * 0.5 + 0.5) * window.innerHeight - 10

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
    ref="labelRef"
    :class="[
      'absolute pointer-events-none text-xs -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300',
      'p-1 bg-[rgba(10,10,25,0.8)] rounded-xl border border-white/10',
      { 'border-red-400/50': institution.level === 'warning' || institution.level === 'danger' },
      { 'bg-[rgba(20,20,40,0.95)] rounded-2xl p-3.5 min-w-40 text-left': isExtended }
    ]"
    style="will-change: transform;"
  >
    <template v-if="isExtended">
      <div class="text-sm font-semibold text-white mb-2 block">{{ institution.name }}</div>
      <div class="text-xs text-green-400 mb-2.5 block">{{ institution.credit }}</div>
      <div class="flex gap-3 text-xs">
        <div class="text-gray-400">已用 <span class="text-green-400 ml-1">{{ institution.used }}</span></div>
        <div class="text-gray-400">履约 <span class="text-green-400 ml-1">{{ institution.rate }}</span></div>
      </div>
    </template>
    <template v-else>
      <div class="font-semibold">{{ institution.abbr }}</div>
      <div class="text-xs text-green-400 mt-0.5">{{ institution.credit }}</div>
    </template>
  </div>
</template>
