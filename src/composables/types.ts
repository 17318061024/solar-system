import type * as THREE from 'three'

export interface Institution {
  name: string
  abbr: string
  category: 'large' | 'medium' | 'small'
  region: 'global' | 'apac' | 'emea' | 'amer'
  credit: string
  used: string
  rate: string
  level: 'normal' | 'warning' | 'danger'
  color: string
}

export interface SolarSystemProps {
  institutions: Institution[]
  width?: number | string
  height?: number | string
  themeColor?: string
}

export interface SolarSystemEmits {
  (e: 'node-click', institution: Institution): void
  (e: 'node-hover', institution: Institution | null): void
}

export interface SolarSystemInst extends Institution {
  angle: number
  orbitRadius: number
  orbitY: number
  curveHeight: number
}

export interface NodeUserData {
  inst: Institution
  angle: number
  baseSize: number
  isSelected: boolean
  isWarning: boolean
  glowRing?: THREE.Mesh
  arc?: THREE.Points
  ring?: THREE.Mesh
  warningRing?: THREE.Mesh
}

export interface CoreUserData {
  isCore: true
  glow: THREE.Mesh
}

export interface ConnectionLineUserData {
  inst: SolarSystemInst
  baseOpacity: number
  sphereColor: string
  curve: THREE.QuadraticBezierCurve3
  sphereRef: THREE.Mesh
}

export interface TrailParticleGroup {
  sphere: THREE.Mesh
  particles: TrailParticle[]
  lastSpawnTime: number
  nextSpawnTime: number
  maxLife: number
  sphereColor: THREE.Color
  particlesObj?: THREE.Points
  posBuffer?: Float32Array
  colorBuffer?: Float32Array
}

export interface TrailParticle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
}

export interface NodeLabelData {
  element: HTMLDivElement
  sphere: THREE.Mesh
  inst: Institution
  isExtended: boolean
}

export interface CoreLabelData {
  element: HTMLDivElement
  sphere: THREE.Mesh
}
