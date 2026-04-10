<script setup lang="ts">
import { computed } from 'vue'
import type { Institution } from '../composables/useSolarSystem'

interface Props {
  institutions: Institution[]
  selectedInstitution?: Institution | null
}

interface Emits {
  (e: 'select', institution: Institution): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const sortedInstitutions = computed(() => {
  return [...props.institutions].sort((a, b) => {
    const aCredit = parseFloat(a.credit.replace('亿', ''))
    const bCredit = parseFloat(b.credit.replace('亿', ''))
    return bCredit - aCredit
  })
})

function getRankClass(index: number): string {
  const inst = sortedInstitutions.value[index]
  if (inst.category === 'large') return 'gold'
  if (inst.category === 'medium') return 'blue'
  return 'other'
}

function getBarClass(level: string): string {
  if (level === 'danger') return 'danger'
  if (level === 'warning') return 'warning'
  return 'normal'
}

function getBarWidth(credit: string): string {
  const maxCredit = 1800
  const currentCredit = parseFloat(credit.replace('亿', ''))
  return Math.min((currentCredit / maxCredit) * 100, 100).toFixed(0)
}

function handleSelect(institution: Institution) {
  emit('select', institution)
}
</script>

<template>
  <div class="fixed left-5 top-20 w-[260px] max-h-[calc(100vh-200px)] overflow-y-auto bg-[rgba(10,10,25,0.92)] rounded-2xl p-5 backdrop-blur-xl border border-white/10 z-100">
    <h3 class="text-sm font-semibold mb-4 text-gray-300 flex items-center gap-2">合作机构榜单</h3>
    <div class="flex flex-col gap-2">
      <div
        v-for="(inst, index) in sortedInstitutions"
        :key="inst.name"
        :class="[
          'flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-300',
          'bg-white/[0.03] hover:bg-white/[0.08]',
          { 'bg-orange-300/15 border border-orange-400/30': selectedInstitution?.name === inst.name }
        ]"
        @click="handleSelect(inst)"
      >
        <div
          :class="[
            'w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold',
            {
              'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black': getRankClass(index) === 'gold',
              'bg-gradient-to-br from-sky-400 to-blue-700 text-white': getRankClass(index) === 'blue',
              'bg-white/15 text-gray-600': getRankClass(index) === 'other'
            }
          ]"
        >
          {{ index + 1 }}
        </div>
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-100">
            {{ inst.name }}
            <small class="text-gray-600">{{ inst.abbr }}</small>
          </div>
          <div class="text-xs text-green-400 mt-0.5">{{ inst.credit }}</div>
          <div class="h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
            <div
              :class="[
                'h-full rounded-full transition-all duration-300',
                {
                  'bg-gradient-to-r from-sky-400 to-blue-700': getBarClass(inst.level) === 'normal',
                  'bg-gradient-to-r from-yellow-400 to-yellow-600': getBarClass(inst.level) === 'warning',
                  'bg-gradient-to-r from-red-500 to-red-800': getBarClass(inst.level) === 'danger'
                }
              ]"
              :style="{ width: getBarWidth(inst.credit) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
