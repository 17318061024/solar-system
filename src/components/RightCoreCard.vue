<script setup lang="ts">
interface CoreMetric {
  totalCredit: string
  totalPartnership: string
  partnersCount: number
  partnershipRate: string
  performanceRate: string
}

interface ChartData {
  quarter: string
  value: number
}

interface Props {
  metrics?: CoreMetric
  chartData?: ChartData[]
}

const props = withDefaults(defineProps<Props>(), {
  metrics: () => ({
    totalCredit: '$2.84T',
    totalPartnership: '$1.45T',
    partnersCount: 15,
    partnershipRate: '85%',
    performanceRate: '92%',
  }),
  chartData: () => [
    { quarter: 'Q1', value: 2.1 },
    { quarter: 'Q2', value: 2.4 },
    { quarter: 'Q3', value: 2.6 },
    { quarter: 'Q4', value: 2.84 },
  ],
})

const maxValue = Math.max(...props.chartData.map(d => d.value))
</script>

<template>
  <div class="absolute right-5 top-20 w-[280px] glass-card z-100">
    <h3 class="text-sm font-semibold mb-4 text-gray-300 flex items-center gap-2">核心主体</h3>
    <div class="flex justify-between mb-4 gap-3">
      <div class="text-center py-3 px-4 bg-white/5 rounded-xl flex-1">
        <div class="text-xl font-bold bg-gradient-to-br from-yellow-400 to-orange-500 bg-clip-text text-transparent">{{ metrics.totalCredit }}</div>
        <div class="text-xs text-gray-500 mt-1">总授信额</div>
      </div>
      <div class="text-center py-3 px-4 bg-white/5 rounded-xl flex-1">
        <div class="text-xl font-bold bg-gradient-to-br from-yellow-400 to-orange-500 bg-clip-text text-transparent">{{ metrics.totalPartnership }}</div>
        <div class="text-xs text-gray-500 mt-1">总合作量</div>
      </div>
    </div>
    <div class="mx-0 my-4 p-3 bg-white/[0.03] rounded-xl">
      <div class="flex justify-between mb-2 text-xs last:mb-0">
        <span class="text-gray-600">合作机构</span>
        <span class="text-white font-medium">{{ metrics.partnersCount }}家</span>
      </div>
      <div class="flex justify-between mb-2 text-xs last:mb-0">
        <span class="text-gray-600">合作能力</span>
        <span class="text-green-400 font-medium">{{ metrics.partnershipRate }}</span>
      </div>
      <div class="flex justify-between text-xs last:mb-0">
        <span class="text-gray-600">履约率</span>
        <span class="text-yellow-400 font-medium">{{ metrics.performanceRate }}</span>
      </div>
    </div>
    <div class="h-30">
      <div class="flex justify-around items-end h-full pt-5">
        <div
          v-for="(data, index) in chartData"
          :key="index"
          class="flex flex-col items-center flex-1"
        >
          <div class="w-8 h-20 bg-white/5 rounded-md relative overflow-hidden">
            <div
              class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-400/60 to-yellow-400/20 rounded-md transition-all duration-500"
              :style="{ height: (data.value / maxValue) * 100 + '%' }"
            ></div>
          </div>
          <div class="mt-2 text-xs text-gray-600">{{ data.quarter }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
