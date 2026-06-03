import * as BABYLON from 'babylonjs'
import { World } from '@root/core/world'
import { InstanceField } from '@root/render/instanceField'
import { xOf, zOf } from '@root/core/grid'
import { MAX_VEHICLES, VEHICLE_BASE_SPEED, VEHICLE_SCALE } from '@root/core/constants'

interface Veh {
    field: InstanceField
    id: number
    commute: boolean
    path: number[] | null
    seg: number
    t: number
}

const _q = new BABYLON.Quaternion()
const _p = new BABYLON.Vector3()
const _s = new BABYLON.Vector3(VEHICLE_SCALE, VEHICLE_SCALE, VEHICLE_SCALE)
const _m = new BABYLON.Matrix()
const HIDDEN = BABYLON.Matrix.Scaling(0, 0, 0)

const COMMUTE_KEYS = ['car_1', 'car_2', 'car_taxi']
const FREIGHT_KEYS = ['car_suv']

// 代表性车辆可视化：从 world.routes 取行程路径实际行驶（速度受拥堵影响）。纯表现层，不回写逻辑。
export class Vehicles {
    private vehicles: Veh[] = []
    private fields: InstanceField[] = []
    private active = false

    constructor(scene: BABYLON.Scene, models: Map<string, BABYLON.Mesh>, private world: World) {
        const commuteFields: InstanceField[] = []
        const freightFields: InstanceField[] = []
        for (const k of COMMUTE_KEYS) {
            const proto = models.get(k)
            if (proto) { const f = new InstanceField(proto, 256); commuteFields.push(f); this.fields.push(f) }
        }
        for (const k of FREIGHT_KEYS) {
            const proto = models.get(k)
            if (proto) { const f = new InstanceField(proto, 256); freightFields.push(f); this.fields.push(f) }
        }
        if (this.fields.length === 0) return
        this.active = true

        const counter: Map<InstanceField, number> = new Map()
        const nFreight = Math.floor(MAX_VEHICLES * 0.3)
        for (let i = 0; i < MAX_VEHICLES; i++) {
            let commute = i >= nFreight
            let group = commute ? commuteFields : freightFields
            if (group.length === 0) { commute = !commute; group = commute ? commuteFields : freightFields }
            if (group.length === 0) continue
            const field = group[i % group.length]
            const id = counter.get(field) || 0
            counter.set(field, id + 1)
            this.vehicles.push({ field, id, commute, path: null, seg: 0, t: 0 })
            field.set(id, HIDDEN)
        }
        this.fields.forEach((f) => f.flush())
    }

    private pickPath(commute: boolean): number[] | null {
        const routes = this.world.routes
        // 简单随机抽样（路线已天然偏向人口多的区域）
        let tries = 6
        while (tries-- > 0) {
            const r = routes[(Math.random() * routes.length) | 0]
            if (r && r.freight === !commute && r.path.length >= 2) return r.path
        }
        return null
    }

    // dt：真实秒；speedMul：模拟倍速（0 暂停时冻结）
    update(dt: number, speedMul: number): void {
        if (!this.active || speedMul <= 0) return
        for (const v of this.vehicles) {
            if (!v.path) {
                const p = this.pickPath(v.commute)
                if (!p) { v.field.set(v.id, HIDDEN); continue }
                v.path = p
                v.seg = 0
                v.t = Math.random()
            }
            const path = v.path
            if (v.seg >= path.length - 1) { v.path = null; v.field.set(v.id, HIDDEN); continue }
            const cur = path[v.seg]
            const cong = this.world.traffic[cur] || 0
            const cps = VEHICLE_BASE_SPEED * speedMul / (1 + cong * 2)
            v.t += cps * dt
            while (v.t >= 1) {
                v.t -= 1
                v.seg++
                if (v.seg >= path.length - 1) break
            }
            if (v.seg >= path.length - 1) { v.path = null; v.field.set(v.id, HIDDEN); continue }
            const a = path[v.seg]
            const b = path[v.seg + 1]
            const ax = xOf(a)
            const az = zOf(a)
            const bx = xOf(b)
            const bz = zOf(b)
            const px = ax + (bx - ax) * v.t
            const pz = az + (bz - az) * v.t
            const yaw = Math.atan2(bx - ax, bz - az)
            BABYLON.Quaternion.RotationYawPitchRollToRef(yaw, 0, 0, _q)
            _p.set(px, 0.12, pz)
            BABYLON.Matrix.ComposeToRef(_s, _q, _p, _m)
            v.field.set(v.id, _m)
        }
        this.fields.forEach((f) => f.flush())
    }
}
