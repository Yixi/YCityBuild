import * as BABYLON from 'babylonjs'
import { MaterialLib } from '@root/render/materials'
import { ServiceType, ZoneType } from '@root/core/types'
import { SERVICE_DEFS } from '@root/core/serviceDefs'
import { createTree } from '@root/model/tree'
import {
    createHorizontalRoad, createConnerRoad, createTIntersectionRoad, createCrossroadRoad,
} from '@root/model/road'

// 所有原型 mesh：每种视觉一个原型 + 共享材质，配合 thin instances 实现「每型 1 draw call」。

const finalize = (mesh: BABYLON.Mesh, key: string): BABYLON.Mesh => {
    mesh.name = key
    mesh.isPickable = false
    mesh.alwaysSelectAsActiveMesh = true
    mesh.setEnabled(false)
    return mesh
}

// 基底位于 y=0 的彩色盒子（高度 1，便于实例矩阵按楼层缩放）
const unitBox = (
    scene: BABYLON.Scene, mat: BABYLON.StandardMaterial, key: string,
    w: number, h: number, d: number
): BABYLON.Mesh => {
    const box = BABYLON.MeshBuilder.CreateBox(key, { width: w, height: h, depth: d }, scene)
    box.material = mat
    box.position.y = h / 2
    box.bakeCurrentTransformIntoVertices()
    return finalize(box, key)
}

export const buildPrototypes = (
    scene: BABYLON.Scene, mats: MaterialLib
): Map<string, BABYLON.Mesh> => {
    const reg = new Map<string, BABYLON.Mesh>()

    // —— 道路（复用 demo 几何，使用共享材质）——
    const shoulder = mats.get('road-shoulder', [0.83, 0.79, 0.77])
    const roadBed = mats.get('road-bed', [0.43, 0.42, 0.44])
    const roadMats: [BABYLON.StandardMaterial, BABYLON.StandardMaterial] = [shoulder, roadBed]
    reg.set('road:H', finalize(createHorizontalRoad(scene, roadMats), 'road:H'))
    reg.set('road:C', finalize(createConnerRoad(scene, roadMats), 'road:C'))
    reg.set('road:T', finalize(createTIntersectionRoad(scene, roadMats), 'road:T'))
    reg.set('road:X', finalize(createCrossroadRoad(scene, roadMats), 'road:X'))

    // —— 建筑（按分区着色，高度由实例矩阵按楼层缩放）——
    reg.set('bld:R', unitBox(scene, mats.get('bld-r', [0.55, 0.75, 0.55]), 'bld:R', 0.8, 1, 0.8))
    reg.set('bld:C', unitBox(scene, mats.get('bld-c', [0.5, 0.6, 0.85]), 'bld:C', 0.8, 1, 0.8))
    reg.set('bld:I', unitBox(scene, mats.get('bld-i', [0.82, 0.72, 0.42]), 'bld:I', 0.85, 1, 0.85))
    reg.set('construct', unitBox(scene, mats.get('bld-construct', [0.62, 0.62, 0.64]), 'construct', 0.7, 1, 0.7))
    reg.set('fire', unitBox(scene, mats.get('bld-fire', [0.22, 0.17, 0.16]), 'fire', 0.8, 1, 0.8))

    // —— 设施 ——
    const svcTypes = [
        ServiceType.POWER, ServiceType.WATER, ServiceType.FIRE, ServiceType.POLICE,
        ServiceType.HEALTH, ServiceType.EDUCATION, ServiceType.PARK, ServiceType.GARBAGE,
        ServiceType.TRANSIT,
    ]
    for (const t of svcTypes) {
        const def = SERVICE_DEFS[t]
        const h = t === ServiceType.POWER ? 1.0 : t === ServiceType.PARK ? 0.25 : 0.6
        reg.set('svc:' + t, unitBox(scene, mats.get('svc-' + t, def.color), 'svc:' + t, 0.85, h, 0.85))
    }

    // —— 分区占位标识（半透明薄板，未长出建筑前显示）——
    reg.set('zone:' + ZoneType.R, unitBox(scene, mats.getAlpha('zone-r', [0.4, 0.85, 0.4], 0.4), 'zone:' + ZoneType.R, 0.92, 0.04, 0.92))
    reg.set('zone:' + ZoneType.C, unitBox(scene, mats.getAlpha('zone-c', [0.4, 0.6, 1], 0.4), 'zone:' + ZoneType.C, 0.92, 0.04, 0.92))
    reg.set('zone:' + ZoneType.I, unitBox(scene, mats.getAlpha('zone-i', [1, 0.85, 0.3], 0.4), 'zone:' + ZoneType.I, 0.92, 0.04, 0.92))
    reg.set('zone:' + ZoneType.RAW, unitBox(scene, mats.getAlpha('zone-raw', [0.7, 0.55, 0.3], 0.4), 'zone:' + ZoneType.RAW, 0.92, 0.04, 0.92))

    // —— 树（复用 demo 几何）——
    reg.set('tree', finalize(createTree(scene), 'tree'))

    return reg
}
