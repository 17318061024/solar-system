<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, toRef } from 'vue'
import { useSolarSystem, type Institution, type SolarSystemProps } from '../composables/useSolarSystem'
import { useMetrics } from '../composables/useMetrics'
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

const {
  containerRef,
  selectedInst,
  init,
  dispose,
  setRegion,
} = useSolarSystem(props)

const { coreMetrics, capabilities } = useMetrics(toRef(props, 'institutions'))

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
</script>

<template>
  <div class="relative w-full h-full" ref="containerRef">
    <!-- 顶部区域切换 -->
    <RegionTabs v-model="currentRegion" />

    <!-- 左侧卡片 - 合作机构榜单 -->
    <LeftRankingCard
      :institutions="props.institutions"
      :selected-institution="selectedInst"
      @select="handleNodeClick"
    />

    <!-- 右侧卡片 - 核心指标 -->
    <RightCoreCard :metrics="coreMetrics" />

    <!-- 右侧卡片 - 能力指标 -->
    <RightCapabilityCard :capabilities="capabilities" />

    <!-- 底部操作提示 -->
    <HintBar />
  </div>
</template>
