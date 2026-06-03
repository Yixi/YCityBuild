import * as BABYLON from 'babylonjs'
import { World } from '@root/core/world'
import { MaterialLib } from '@root/render/materials'
import { buildPrototypes } from '@root/render/prototypes'
import { InstanceField } from '@root/render/instanceField'
import { BuildingState, RoadShape, ServiceType, ZoneType } from '@root/core/types'
import { xOf, zOf } from '@root/core/grid'

// 设施类型 → 模型 key（缺失则回退彩色方块）
const SERVICE_MODEL: Record<number, string> = {
    [ServiceType.POWER]: 'svc_power',
    [ServiceType.WATER]: 'svc_water',
    [ServiceType.FIRE]: 'svc_fire',
    [ServiceType.POLICE]: 'svc_police',
    [ServiceType.HEALTH]: 'svc_health',
    [ServiceType.EDUCATION]: 'svc_education',
    [ServiceType.PARK]: 'svc_park',
    [ServiceType.GARBAGE]: 'svc_garbage',
    [ServiceType.TRANSIT]: 'svc_transit',
}

const R_H = [0.7, 1.3, 2.1]
const C_H = [0.9, 1.7, 2.7]
const I_H = [0.8, 1.2, 1.7]

const heightFor = (zone: ZoneType, level: number): number => {
    const a = zone === ZoneType.R ? R_H : zone === ZoneType.C ? C_H : I_H
    return a[Math.min(Math.max(level, 1), 3) - 1]
}

const zoneLetter = (zone: ZoneType): string =>
    zone === ZoneType.R ? 'R' : zone === ZoneType.C ? 'C' : 'I'

// 各「分区×等级」的模型变体池（按格子哈希确定性选一个，避免千篇一律）
const DESIRED_POOLS: Record<number, string[]> = {
    // 住宅 R：独栋 → 公寓 → 住宅塔
    11: ['house_1', 'house_2', 'house_3', 'house_4', 'house_5'],
    12: ['bldg_low_1', 'bldg_low_2', 'house_2', 'house_4'],
    13: ['tower_1'],
    // 商业 C：小店 → 楼宇 → 商业塔
    21: ['bldg_small_1', 'bldg_small_2', 'bldg_small_3'],
    22: ['bldg_low_1', 'bldg_large_1', 'bldg_low_2'],
    23: ['tower_2', 'tower_1'],
    // 工业 I：宽厂房 → 大厂房 → 高塔
    31: ['bldg_wide_1', 'bldg_large_3'],
    32: ['bldg_large_2', 'bldg_large_3'],
    33: ['tower_3'],
    // 原料业 RAW：谷仓/筒仓/大谷仓（ZoneType.RAW=4）
    41: ['farm_barn', 'farm_silo', 'farm_big'],
    42: ['farm_big', 'farm_barn'],
    43: ['farm_big'],
}

interface Visual {
    key: string
    sy: number
    rot: number
}

const _scale = new BABYLON.Vector3(1, 1, 1)
const _pos = new BABYLON.Vector3()
const _quat = new BABYLON.Quaternion()
const _mat = new BABYLON.Matrix()
const compose = (sy: number, rot: number, x: number, z: number): BABYLON.Matrix => {
    _scale.set(1, sy, 1)
    BABYLON.Quaternion.RotationYawPitchRollToRef(rot, 0, 0, _quat)
    _pos.set(x, 0, z)
    BABYLON.Matrix.ComposeToRef(_scale, _quat, _pos, _mat)
    return _mat
}

// 城市渲染器：把网格逻辑状态映射为各原型（方块 + 真实模型）的薄实例，按脏格集增量更新。
export class CityRenderer {
    private prototypes: Map<string, BABYLON.Mesh>
    private fields: Map<string, InstanceField> = new Map()
    private cellVisual: Map<number, string> = new Map()
    private modelPools: Record<number, string[]> = {}

    constructor(scene: BABYLON.Scene, mats: MaterialLib, models?: Map<string, BABYLON.Mesh>) {
        this.prototypes = buildPrototypes(scene, mats)
        if (models) {
            models.forEach((mesh, key) => this.prototypes.set(key, mesh))
            for (const k of Object.keys(DESIRED_POOLS)) {
                const pool = DESIRED_POOLS[+k].filter((key) => models.has(key))
                if (pool.length > 0) this.modelPools[+k] = pool
            }
        }
    }

    private field(key: string): InstanceField {
        let f = this.fields.get(key)
        if (!f) {
            const proto = this.prototypes.get(key)
            f = new InstanceField(proto)
            this.fields.set(key, f)
        }
        return f
    }

    // 选模型变体；无对应模型则返回 null（回退方块）
    private pickBuildingModel(zone: ZoneType, level: number, cell: number): string | null {
        const pool = this.modelPools[zone * 10 + Math.min(Math.max(level, 1), 3)]
        if (!pool || pool.length === 0) return null
        const h = (cell * 2654435761) >>> 0
        return pool[h % pool.length]
    }

    private visualFor(world: World, cell: number): Visual | null {
        if (world.road[cell] === 1) {
            const shape = world.roadShape[cell] as RoadShape
            if (shape === RoadShape.VERTICAL) return { key: 'road:H', sy: 1, rot: Math.PI / 2 }
            if (shape === RoadShape.CONNER) return { key: 'road:C', sy: 1, rot: world.roadRot[cell] }
            if (shape === RoadShape.T_INTERSECTION) return { key: 'road:T', sy: 1, rot: world.roadRot[cell] }
            if (shape === RoadShape.CROSSROAD) return { key: 'road:X', sy: 1, rot: 0 }
            return { key: 'road:H', sy: 1, rot: 0 }
        }
        const id = world.buildingId[cell]
        if (id >= 0) {
            const b = world.buildings[id]
            if (b) {
                if (b.isService) {
                    const mk = SERVICE_MODEL[b.service]
                    if (mk && this.prototypes.has(mk)) return { key: mk, sy: 1, rot: 0 }
                    return { key: 'svc:' + b.service, sy: 1, rot: 0 }
                }
                if (b.state === BuildingState.CONSTRUCTING) {
                    return { key: 'construct', sy: 0.2 + 0.8 * b.progress, rot: 0 }
                }
                if (b.state === BuildingState.ONFIRE) {
                    return { key: 'fire', sy: heightFor(b.zone, b.level), rot: 0 }
                }
                const mk = this.pickBuildingModel(b.zone, b.level, cell)
                if (mk) {
                    const rot = ((cell * 40503) >>> 0) % 4 * (Math.PI / 2)
                    return { key: mk, sy: 1, rot }
                }
                return { key: 'bld:' + zoneLetter(b.zone), sy: heightFor(b.zone, b.level), rot: 0 }
            }
        }
        if (world.zone[cell] !== ZoneType.NONE) {
            return { key: 'zone:' + world.zone[cell], sy: 1, rot: 0 }
        }
        if (world.tree[cell] === 1) {
            return { key: 'tree', sy: 1, rot: (cell % 16) / 16 * Math.PI * 2 }
        }
        return null
    }

    private update(world: World, cell: number): void {
        const v = this.visualFor(world, cell)
        const oldKey = this.cellVisual.get(cell)
        if (oldKey !== undefined && (!v || v.key !== oldKey)) {
            this.field(oldKey).remove(cell)
        }
        if (v) {
            const m = compose(v.sy, v.rot, xOf(cell), zOf(cell))
            this.field(v.key).set(cell, m)
            this.cellVisual.set(cell, v.key)
        } else {
            this.cellVisual.delete(cell)
        }
    }

    sync(world: World): void {
        if (world.renderDirty.size === 0) return
        world.renderDirty.forEach((cell) => this.update(world, cell))
        world.renderDirty.clear()
        this.fields.forEach((f) => f.flush())
    }

    initialSync(world: World): void {
        for (let c = 0; c < world.n; c++) {
            if (world.road[c] === 1 || world.buildingId[c] >= 0
                || world.zone[c] !== ZoneType.NONE || world.tree[c] === 1) {
                world.renderDirty.add(c)
            }
        }
        this.sync(world)
    }
}
