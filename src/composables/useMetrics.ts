import { computed, type Ref } from 'vue'
import type { Institution } from './types'

export function useMetrics(institutions: Ref<Institution[]>) {
  const totalCredit = computed(() => {
    const total = institutions.value.reduce((sum, inst) => {
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

  const coreMetrics = computed(() => ({
    totalCredit: totalCredit.value,
    totalPartnership: '$1.45T',
    partnersCount: institutions.value.length,
    partnershipRate: '85%',
    performanceRate: '92%',
  }))

  const capabilities = [
    { label: '合作能力', value: '85%', percentage: 85 },
    { label: '风险控制', value: '92%', percentage: 92 },
    { label: '服务效率', value: '78%', percentage: 78 },
    { label: '产品覆盖', value: '65%', percentage: 65 },
  ]

  return { totalCredit, coreMetrics, capabilities }
}
