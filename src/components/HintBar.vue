<script setup lang="ts">
interface Hint {
  action: string
  description: string
}

interface Props {
  hints?: Hint[]
}

withDefaults(defineProps<Props>(), {
  hints: () => [
    { action: '拖拽', description: '旋转' },
    { action: '滚轮', description: '缩放' },
    { action: '点击/悬停', description: '查看详情' },
  ],
})
</script>

<template>
  <div class="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[rgba(15,15,35,0.8)] px-5 py-2 rounded-full text-xs text-gray-600 backdrop-blur-md border border-white/10 z-100">
    <template v-for="(hint, index) in hints" :key="index">
      <span class="text-green-400 font-medium">{{ hint.action }}</span> {{ hint.description }}
      <span v-if="index < hints.length - 1"> | </span>
    </template>
  </div>
</template>
