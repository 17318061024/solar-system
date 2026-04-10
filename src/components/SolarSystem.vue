<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSolarSystem, type Institution, type SolarSystemProps } from '../composables/useSolarSystem'
import RegionTabs from './RegionTabs.vue'
import LeftRankingCard from './LeftRankingCard.vue'
import RightCoreCard from './RightCoreCard.vue'
import RightCapabilityCard from './RightCapabilityCard.vue'
import HintBar from './HintBar.vue'

const props = defineProps<SolarSystemProps>()

const emit = defineEmits<{
  (e: 'node-click', institution: Institution): void
  (e: 'node-hover', institution: Institution | null): void
  (e: 'region-change', region: string): void
}>()

const currentRegion = ref('global')

const solarSystem = useSolarSystem(props)

const {
  containerRef,
  selectedInst,
  hoveredInst,
  camera,
  coreSphere,
  init,
  dispose,
  setRegion,
} = solarSystem

// 计算总授信额
const totalCredit = computed(() => {
  const total = props.institutions.reduce((sum, inst) => {
    const num = parseFloat(inst.credit.replace('亿', ''))
    return sum + num * 100000000
  }, 0)

  if (total >= 100000000000) {
    return '$' + (total / 100000000000).toFixed(2) + 'T'
  } else if (total >= 100000000) {
    return '$' + (total / 100000000).toFixed(0) + 'B'
  }
  return '$' + total.toString()
})

// 核心指标数据
const coreMetrics = computed(() => ({
  totalCredit: totalCredit.value,
  totalPartnership: '$1.45T',
  partnersCount: props.institutions.length,
  partnershipRate: '85%',
  performanceRate: '92%',
}))

onMounted(() => {
  init()
})

onUnmounted(() => {
  dispose()
})

watch(() => currentRegion.value, (region) => {
  setRegion(region)
  emit('region-change', region)
})

function handleNodeClick(inst: Institution) {
  emit('node-click', inst)
}

function handleRegionChange(region: string) {
  currentRegion.value = region
  emit('region-change', region)
}
</script>

<template>
  <div class="relative w-full h-full" ref="containerRef">
    <!-- 顶部区域切换 -->
    <RegionTabs
      v-model="currentRegion"
      @change="handleRegionChange"
    />

    <!-- 左侧卡片 - 合作机构榜单 -->
    <LeftRankingCard
      :institutions="institutions"
      :selected-institution="selectedInst"
      @select="handleNodeClick"
    />

    <!-- 右侧卡片 - 核心指标 -->
    <RightCoreCard :metrics="coreMetrics" />

    <!-- 右侧卡片 - 能力指标 -->
    <RightCapabilityCard />

    <!-- 底部操作提示 -->
    <HintBar />
  </div>
</template>
