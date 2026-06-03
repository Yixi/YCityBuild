import * as BABYLON from 'babylonjs'
import { World } from '@root/core/world'
import { MaterialLib } from '@root/render/materials'
import { buildPrototypes } from '@root/render/prototypes'
import { InstanceField } from '@root/render/instanceField'
import { BuildingState, RoadShape, ZoneType } from '@root/core/types'
import { xOf, zOf } from '@root/core/grid'

const R_H = [0.7, 1.3, 2.1]
const C_H = [0.9, 1.7, 2.7]
const I_H = [0.8, 1.2, 1.7]

const heightFor = (zone: ZoneType, level: number): number => {
    const a = zone === ZoneType.R ? R_H : zone === ZoneType.C ? C_H : I_H
    return a[Math.min(Math.max(level, 1), 3) - 1]
}

const zoneLetter = (zone: ZoneType): string =>
    zone === ZoneType.R ? 'R' : zone === ZoneType.C ? 'C' : 'I'

interface Visual {
    key: string
    sy: number
    rot: number
}

// 复用的矩阵构造（避免逐格分配）
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

// 城市渲染器：把网格逻辑状态映射为各原型的薄实例，按脏格集增量更新。
export class CityRenderer {
    private prototypes: Map<string, BABYLON.Mesh>
    private fields: Map<string, InstanceField> = new Map()
    private cellVisual: Map<number, string> = new Map()

    constructor(scene: BABYLON.Scene, mats: MaterialLib) {
        this.prototypes = buildPrototypes(scene, mats)
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
                if (b.isService) return { key: 'svc:' + b.service, sy: 1, rot: 0 }
                if (b.state === BuildingState.CONSTRUCTING) {
                    return { key: 'construct', sy: 0.2 + 0.8 * b.progress, rot: 0 }
                }
                if (b.state === BuildingState.ONFIRE) {
                    return { key: 'fire', sy: heightFor(b.zone, b.level), rot: 0 }
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

    // 每帧排空脏格集，增量更新实例
    sync(world: World): void {
        if (world.renderDirty.size === 0) return
        world.renderDirty.forEach((cell) => this.update(world, cell))
        world.renderDirty.clear()
        this.fields.forEach((f) => f.flush())
    }

    // 初次全量铺设
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
