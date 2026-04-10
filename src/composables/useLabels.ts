import * as THREE from 'three'
import type { SceneContext } from './useScene'
import type { Institution, NodeLabelData, CoreLabelData } from './types'

export function useLabels(ctx: {
  sceneCtx: SceneContext
  nodeSpheres: THREE.Mesh[]
  coreSphere: THREE.Mesh
}) {
  let nodeLabels: NodeLabelData[] = []
  let coreLabel: CoreLabelData | null = null

  function createLabels(institutions: Institution[]) {
    // Core label
    const totalCredit = institutions.reduce((sum, inst) => {
      const num = parseFloat(inst.credit.replace('亿', ''))
      return sum + num * 100000000
    }, 0)

    const creditStr = totalCredit >= 100000000000
      ? '$' + (totalCredit / 100000000000).toFixed(2) + 'T'
      : totalCredit >= 100000000
        ? '$' + (totalCredit / 100000000).toFixed(0) + 'B'
        : '$' + totalCredit.toString()

    const coreEl = document.createElement('div')
    coreEl.className = 'core-label'
    coreEl.innerHTML = `
      <span><span class="dot"></span><span class="name">核心主体</span></span>
      <div class="line"></div>
      <div class="row">
        <div class="data">总授信 <span>${creditStr}</span></div>
        <div class="data">总合作量 <span>${institutions.length}家</span></div>
      </div>
    `
    document.body.appendChild(coreEl)
    coreLabel = { element: coreEl, sphere: ctx.coreSphere }

    // Node labels
    institutions.forEach((inst, i) => {
      if (i >= ctx.nodeSpheres.length) return
      const label = document.createElement('div')
      label.className = `node-label${inst.level === 'warning' || inst.level === 'danger' ? ' warning' : ''}`
      label.innerHTML = `<div class="abbr">${inst.abbr}</div><div class="amount">${inst.credit}</div>`
      document.body.appendChild(label)
      nodeLabels.push({ element: label, sphere: ctx.nodeSpheres[i], inst, isExtended: false })
    })
  }

  function updateLabels() {
    if (!coreLabel || !coreLabel.element.parentElement) return

    // Core label
    const p = coreLabel.sphere.position.clone()
    p.y += 45
    p.project(ctx.sceneCtx.camera)
    const cx = (p.x * 0.5 + 0.5) * window.innerWidth
    const cy = (-p.y * 0.5 + 0.5) * window.innerHeight - 20
    coreLabel.element.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -100%)`
    coreLabel.element.style.opacity = p.z > 1 ? '0' : '1'

    // Node labels
    nodeLabels.forEach((l) => {
      if (!l.sphere.visible) {
        l.element.style.display = 'none'
        return
      }

      const offsetY = l.isExtended ? 40 : 20
      const pos = l.sphere.position.clone()
      pos.y += offsetY
      pos.project(ctx.sceneCtx.camera)

      const x = (pos.x * 0.5 + 0.5) * window.innerWidth
      const y = (-pos.y * 0.5 + 0.5) * window.innerHeight - 10
      l.element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
      l.element.style.display = 'block'
      l.element.style.opacity = pos.z > 1 ? '0' : '1'
    })
  }

  function setExtended(instName: string | null) {
    nodeLabels.forEach((l) => {
      if (l.inst.name === instName && !l.isExtended) {
        l.isExtended = true
        l.element.classList.add('extended')
        l.element.innerHTML = `
          <div class="name">${l.inst.name}</div>
          <div class="amount">${l.inst.credit}</div>
          <div class="stats">
            <div class="stat">已用 <span>${l.inst.used}</span></div>
            <div class="stat">履约 <span>${l.inst.rate}</span></div>
          </div>
        `
      } else if (l.inst.name !== instName && l.isExtended) {
        l.isExtended = false
        l.element.classList.remove('extended')
        l.element.innerHTML = `<div class="abbr">${l.inst.abbr}</div><div class="amount">${l.inst.credit}</div>`
      }
    })
  }

  function setRegion(region: string) {
    nodeLabels.forEach((l) => {
      const visible = region === 'global' || l.inst.region === region
      l.element.style.display = visible ? 'block' : 'none'
    })
  }

  function dispose() {
    if (coreLabel && coreLabel.element.parentElement) {
      coreLabel.element.parentElement.removeChild(coreLabel.element)
    }
    nodeLabels.forEach((l) => {
      if (l.element.parentElement) {
        l.element.parentElement.removeChild(l.element)
      }
    })
    nodeLabels = []
    coreLabel = null
  }

  return { createLabels, updateLabels, setExtended, setRegion, dispose }
}
