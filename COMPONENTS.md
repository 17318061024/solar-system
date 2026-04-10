# Vue3 组件使用说明

## 组件架构

可视宇宙图已被拆分为以下Vue3组件：

### 主要组件

1. **SolarSystem.vue** - 主容器组件
   - 集成Three.js 3D场景和所有UI组件
   - 处理区域切换和节点选择
   - 提供完整的交互功能

2. **useSolarSystem.ts** - 核心逻辑Composable
   - 管理Three.js场景、相机、渲染器
   - 处理3D对象创建和动画
   - 提供响应式状态管理

### UI卡片组件

3. **RegionTabs.vue** - 区域切换组件
   - 显示全球视图和各区域选项
   - 支持v-model双向绑定
   - 完全Tailwind CSS样式

4. **LeftRankingCard.vue** - 左侧合作机构榜单
   - 显示机构排名和授信额度
   - 支持点击选择机构
   - 动态进度条显示
   - 完全Tailwind CSS样式

5. **RightCoreCard.vue** - 右侧核心指标卡片
   - 显示总授信额和总合作量
   - 展示合作机构数量和能力指标
   - 包含Q1-Q4趋势图表
   - 完全Tailwind CSS样式

6. **RightCapabilityCard.vue** - 右侧能力指标卡片
   - 显示关键能力指标
   - 动态进度条展示
   - 完全Tailwind CSS样式

7. **HintBar.vue** - 底部操作提示
   - 显示用户操作指南
   - 可自定义提示内容
   - 完全Tailwind CSS样式

### 标签组件

8. **CoreLabel.vue** - 核心球体标签
   - 跟随核心球体位置
   - 显示总授信和合作量信息
   - 完全Tailwind CSS样式

9. **NodeLabel.vue** - 节点标签
   - 跟随行星节点位置
   - 支持展开/收起模式
   - 显示详细信息
   - 完全Tailwind CSS样式

## 使用方法

### 基本使用

```vue
<script setup lang="ts">
import SolarSystem from './components/SolarSystem.vue'
import type { Institution } from './composables/useSolarSystem'

const institutions: Institution[] = [
  {
    name: '摩根大通',
    abbr: 'JPM',
    category: 'large',
    region: 'amer',
    credit: '1500亿',
    used: '1200亿',
    rate: '95%',
    level: 'normal',
    color: '#ffd700'
  },
  // ... 更多机构数据
]
</script>

<template>
  <SolarSystem
    :institutions="institutions"
    theme-color="#ff6b35"
    @node-click="handleNodeClick"
    @node-hover="handleNodeHover"
    @region-change="handleRegionChange"
  />
</template>
```

### 组件Props

#### SolarSystem

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| institutions | Institution[] | [] | 金融机构数据 |
| width | number \| string | '100%' | 容器宽度 |
| height | number \| string | '100%' | 容器高度 |
| themeColor | string | '#ff6b35' | 主题颜色 |

#### Institution 接口

```typescript
interface Institution {
  name: string              // 机构名称
  abbr: string              // 机构缩写
  category: 'large' | 'medium' | 'small'  // 机构规模
  region: 'global' | 'apac' | 'emea' | 'amer'  // 所属区域
  credit: string            // 授信额度 (如: '1500亿')
  used: string              // 已用额度 (如: '1200亿')
  rate: string              // 履约率 (如: '95%')
  level: 'normal' | 'warning' | 'danger'  // 风险等级
  color: string             // 显示颜色
}
```

### 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| node-click | institution | 点击节点时触发 |
| node-hover | institution \| null | 悬停节点时触发 |
| region-change | region | 切换区域时触发 |

### 单独使用UI组件

#### RegionTabs

```vue
<RegionTabs
  v-model="currentRegion"
  :regions="[
    { value: 'global', label: '全球视图' },
    { value: 'apac', label: 'APAC' },
    { value: 'emea', label: 'EMEA' },
    { value: 'amer', label: 'AMER' }
  ]"
  @change="handleRegionChange"
/>
```

#### LeftRankingCard

```vue
<LeftRankingCard
  :institutions="institutions"
  :selected-institution="selectedInst"
  @select="handleSelect"
/>
```

#### RightCoreCard

```vue
<RightCoreCard
  :metrics="{
    totalCredit: '$2.84T',
    totalPartnership: '$1.45T',
    partnersCount: 15,
    partnershipRate: '85%',
    performanceRate: '92%'
  }"
/>
```

#### RightCapabilityCard

```vue
<RightCapabilityCard
  :capabilities="[
    { label: '合作能力', value: '85%', percentage: 85 },
    { label: '风险控制', value: '92%', percentage: 92 }
  ]"
/>
```

#### HintBar

```vue
<HintBar
  :hints="[
    { action: '拖拽', description: '旋转' },
    { action: '滚轮', description: '缩放' }
  ]"
/>
```

## 样式定制

所有组件都使用 **Tailwind CSS** 进行样式定制，没有传统的 scoped CSS。

### 主要颜色配置
- 背景色: `#050510` (bg-[#050510])
- 卡片背景: `rgba(10, 10, 25, 0.92)` (bg-[rgba(10,10,25,0.92)])
- 主题色: `#ff6b35` (orange-500)
- 成功色: `#00ff88` (green-400)
- 警告色: `#ffd54f` (yellow-400)
- 危险色: `#ef5350` (red-500)

### Tailwind CSS 扩展

组件使用了以下 Tailwind 特性：
- 任意值语法 (如 `w-[280px]`, `bg-[rgba(10,10,25,0.92)]`)
- 状态变体 (hover, active)
- 渐变背景 (gradient-to-br, gradient-to-r)
- 模糊效果 (backdrop-blur)
- 动画过渡 (transition-all)

## 开发服务器

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Three.js
- Tailwind CSS
- Vite

## 功能特性

✅ 3D星空背景动画
✅ 核心球体自转和光晕效果
✅ 行星节点公转动画
✅ 鼠标拖拽旋转视角
✅ 滚轮缩放
✅ 点击/悬停节点查看详情
✅ 区域筛选
✅ 响应式布局
✅ 流畅的动画过渡

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

需要支持WebGL的现代浏览器。
