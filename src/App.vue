<script setup lang="ts">
import SolarSystem from './components/SolarSystem.vue'
import type { Institution } from './composables/useSolarSystem'

const institutions: Institution[] = [
  { name: '摩根大通', abbr: 'JPM', category: 'large', region: 'amer', credit: '1500亿', used: '1200亿', rate: '95%', level: 'normal', color: '#ffd700' },
  { name: '美国银行', abbr: 'BOFA', category: 'large', region: 'amer', credit: '1200亿', used: '900亿', rate: '90%', level: 'normal', color: '#ffd700' },
  { name: '花旗银行', abbr: 'CITI', category: 'large', region: 'amer', credit: '1000亿', used: '800亿', rate: '88%', level: 'normal', color: '#ffd700' },
  { name: '汇丰银行', abbr: 'HSBC', category: 'large', region: 'apac', credit: '1800亿', used: '1400亿', rate: '92%', level: 'warning', color: '#ffd700' },
  { name: '渣打银行', abbr: 'SCB', category: 'large', region: 'apac', credit: '1500亿', used: '1100亿', rate: '85%', level: 'normal', color: '#ffd700' },
  { name: '三菱银行', abbr: 'MUB', category: 'large', region: 'apac', credit: '1200亿', used: '900亿', rate: '89%', level: 'normal', color: '#ffd700' },
  { name: '瑞穗银行', abbr: 'MHB', category: 'large', region: 'apac', credit: '1100亿', used: '850亿', rate: '91%', level: 'normal', color: '#ffd700' },
  { name: '德意志', abbr: 'DB', category: 'medium', region: 'emea', credit: '800亿', used: '600亿', rate: '87%', level: 'normal', color: '#00bfff' },
  { name: '巴黎银行', abbr: 'BNP', category: 'medium', region: 'emea', credit: '700亿', used: '500亿', rate: '86%', level: 'normal', color: '#00bfff' },
  { name: '荷兰合作', abbr: 'RAB', category: 'medium', region: 'emea', credit: '600亿', used: '450亿', rate: '84%', level: 'normal', color: '#00bfff' },
  { name: '北欧联合', abbr: 'Nordea', category: 'medium', region: 'emea', credit: '550亿', used: '400亿', rate: '83%', level: 'normal', color: '#00bfff' },
  { name: '瑞士银行', abbr: 'UBS', category: 'medium', region: 'emea', credit: '500亿', used: '380亿', rate: '91%', level: 'normal', color: '#00bfff' },
  { name: '摩根士丹利', abbr: 'MS', category: 'medium', region: 'amer', credit: '400亿', used: '300亿', rate: '89%', level: 'normal', color: '#00bfff' },
  { name: '高盛', abbr: 'GS', category: 'medium', region: 'amer', credit: '350亿', used: '280亿', rate: '93%', level: 'normal', color: '#00bfff' },
  { name: '瑞银集团', abbr: 'CS', category: 'small', region: 'emea', credit: '300亿', used: '220亿', rate: '82%', level: 'normal', color: '#00ff88' },
]
</script>

<template>
  <div class="app-container">
    <SolarSystem
      :institutions="institutions"
      theme-color="#ff6b35"
    />
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
</style>
