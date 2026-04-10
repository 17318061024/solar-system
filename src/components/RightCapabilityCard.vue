<script setup lang="ts">
interface Capability {
  label: string
  value: string
  percentage: number
}

interface Props {
  capabilities?: Capability[]
}

withDefaults(defineProps<Props>(), {
  capabilities: () => [
    { label: '合作能力', value: '85%', percentage: 85 },
    { label: '风险控制', value: '92%', percentage: 92 },
    { label: '服务效率', value: '78%', percentage: 78 },
    { label: '产品覆盖', value: '65%', percentage: 65 },
  ],
})
</script>

<template>
  <div class="absolute right-5 top-80 w-[280px] glass-card z-100">
    <h3 class="text-sm font-semibold mb-4 text-gray-300 flex items-center gap-2">关键能力指标</h3>
    <div class="flex flex-col gap-2.5">
      <div
        v-for="(capability, index) in capabilities"
        :key="index"
        class="flex items-center gap-2.5"
      >
        <span class="text-xs text-gray-400 w-[60px]">{{ capability.label }}</span>
        <div class="flex-1 h-1.5 bg-white/10 rounded-md overflow-hidden">
          <div
            class="h-full rounded-md bg-gradient-to-r from-teal-500 to-green-400 transition-all duration-300"
            :style="{ width: capability.percentage + '%' }"
          ></div>
        </div>
        <span class="text-xs text-green-400 w-10 text-right">{{ capability.value }}</span>
      </div>
    </div>
  </div>
</template>
