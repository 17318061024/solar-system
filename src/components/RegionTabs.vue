<script setup lang="ts">
interface Region {
  value: string
  label: string
}

interface Props {
  regions?: Region[]
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', region: string): void
  (e: 'change', region: string): void
}

const props = withDefaults(defineProps<Props>(), {
  regions: () => [
    { value: 'global', label: '全球视图' },
    { value: 'apac', label: 'APAC' },
    { value: 'emea', label: 'EMEA' },
    { value: 'amer', label: 'AMER' },
  ],
  modelValue: 'global',
})

const emit = defineEmits<Emits>()

function handleRegionChange(region: string) {
  emit('update:modelValue', region)
  emit('change', region)
}
</script>

<template>
  <div class="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
    <button
      v-for="region in regions"
      :key="region.value"
      :class="[
        'px-4 py-2 text-sm rounded-lg transition-all',
        'bg-white/10 text-white/70 backdrop-blur-md',
        'border border-white/20',
        'hover:bg-white/20 hover:text-white',
        {
          'bg-orange-500/30 text-orange-400 border-orange-400/50': modelValue === region.value
        }
      ]"
      @click="handleRegionChange(region.value)"
    >
      {{ region.label }}
    </button>
  </div>
</template>
