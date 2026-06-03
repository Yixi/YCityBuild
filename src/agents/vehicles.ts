import * as BABYLON from 'babylonjs'
import { World } from '@root/core/world'
import { InstanceField } from '@root/render/instanceField'
import { buildLanePath, sampleLane, LanePath } from '@root/agents/laneGraph'
import { TrafficSignals } from '@root/agents/trafficSignals'
import {
    MAP_SIZE, MAX_VEHICLES, VEHICLE_DENSITY, VEHICLE_BASE_SPEED, VEHICLE_SCALE,
    CAR_LENGTH, SAFE_GAP, MIN_GAP, VEHICLE_ACCEL,
} from '@root/core/constants'

interface Veh {
    field: InstanceField
    id: number
    gid: number        // 全局唯一 id（重叠让行用）
    commute: boolean
    lane: LanePath | null
    s: number          // 弧长进度
    seg: number        // 当前段缓存
    speed: number
    target: number     // 本帧目标速度
    x: number
    z: number
    dirIdx: number     // 量化航向 0E 1W 2N 3S
    proj: number       // 沿航向的投影（同向排序用）
}

const _q = new BABYLON.Quaternion()
const _p = new BABYLON.Vector3()
const _s = new BABYLON.Vector3(VEHICLE_SCALE, VEHICLE_SCALE, VEHICLE_SCALE)
const _m = new BABYLON.Matrix()
const _out = [0, 0, 0, 0]
const HIDDEN = BABYLON.Matrix.Scaling(0, 0, 0)

const COMMUTE_KEYS = ['car_1', 'car_2', 'car_taxi']
const FREIGHT_KEYS = ['car_suv']
const DIR_VEC: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]]

// 由航向计算量化方向与投影
const setDirProj = (v: Veh, hx: number, hz: number): void => {
    if (Math.abs(hx) >= Math.abs(hz)) {
        if (hx >= 0) { v.dirIdx = 0; v.proj = v.x } else { v.dirIdx = 1; v.proj = -v.x }
    } else {
        if (hz >= 0) { v.dirIdx = 2; v.proj = v.z } else { v.dirIdx = 3; v.proj = -v.z }
    }
}

// 微观交通：车辆沿车道折线行驶（双向分离+转弯），跟车排队，守信号灯。纯表现层，不回写逻辑。
export class Vehicles {
    private vehicles: Veh[] = []
    private fields: InstanceField[] = []
    private active = false
    private buckets: Map<number, Veh[]> = new Map()

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
            this.vehicles.push({
                field, id, gid: i, commute, lane: null, s: 0, seg: 1, speed: 0, target: 0,
                x: 0, z: 0, dirIdx: 0, proj: 0,
            })
            field.set(id, HIDDEN)
        }
        this.fields.forEach((f) => f.flush())
    }

    private pickPath(commute: boolean): number[] | null {
        const routes = this.world.routes
        let tries = 6
        while (tries-- > 0) {
            const r = routes[(Math.random() * routes.length) | 0]
            if (r && r.freight === !commute && r.path.length >= 2) return r.path
        }
        return null
    }

    private cellOf(v: Veh): number {
        const cx = Math.round(v.x)
        const cz = Math.round(v.z)
        if (cx < 0 || cz < 0 || cx >= MAP_SIZE || cz >= MAP_SIZE) return -1
        return cx * MAP_SIZE + cz
    }

    // 到前车的间距（同向同格 + 前方一格），无前车返回较大值
    private leaderGap(v: Veh): number {
        const cx = Math.round(v.x)
        const cz = Math.round(v.z)
        let best = 999
        const scan = (key: number): void => {
            const arr = this.buckets.get(key)
            if (!arr) return
            for (const o of arr) {
                if (o === v) continue
                // 明显在前方 → 跟车；几乎完全重叠 → 由较大 gid 让行（打破对称死锁）
                const ahead = o.proj > v.proj + 0.02
                    || (Math.abs(o.proj - v.proj) <= 0.03 && o.gid < v.gid)
                if (ahead) {
                    const g = o.proj - v.proj
                    if (g < best) best = g
                }
            }
        }
        scan((cx * MAP_SIZE + cz) * 4 + v.dirIdx)
        const [ax, az] = DIR_VEC[v.dirIdx]
        const nx = cx + ax
        const nz = cz + az
        if (nx >= 0 && nz >= 0 && nx < MAP_SIZE && nz < MAP_SIZE) {
            scan((nx * MAP_SIZE + nz) * 4 + v.dirIdx)
        }
        return best - CAR_LENGTH
    }

    private assign(v: Veh): boolean {
        const p = this.pickPath(v.commute)
        if (!p) { v.field.set(v.id, HIDDEN); v.lane = null; return false }
        // 50% 反向行驶（代表返程），形成双向车流
        const path = Math.random() < 0.5 ? p : p.slice().reverse()
        const lane = buildLanePath(path)
        if (lane.total < 0.2) { v.field.set(v.id, HIDDEN); v.lane = null; return false }
        v.lane = lane
        v.s = Math.random() * lane.total
        v.seg = sampleLane(lane, v.s, 1, _out)
        v.speed = VEHICLE_BASE_SPEED * 0.4
        v.x = _out[0]; v.z = _out[1]
        setDirProj(v, _out[2], _out[3])
        return true
    }

    // dt：真实秒；speedMul：模拟倍速（0 暂停时冻结）；signals：信号控制（可选）
    update(dt: number, speedMul: number, signals?: TrafficSignals): void {
        if (!this.active || speedMul <= 0) return

        // 趟1：分配车道（活跃数按路网规模封顶）+ 构建空间分桶
        this.buckets.clear()
        const maxActive = Math.min(MAX_VEHICLES, Math.max(8, Math.round(this.world.roadCount * VEHICLE_DENSITY)))
        let activeCount = 0
        for (const v of this.vehicles) if (v.lane) activeCount++
        for (const v of this.vehicles) {
            if (!v.lane) {
                if (activeCount >= maxActive) { v.field.set(v.id, HIDDEN); continue }
                if (!this.assign(v)) continue
                activeCount++
            }
            const cell = this.cellOf(v)
            if (cell < 0) continue
            const key = cell * 4 + v.dirIdx
            let arr = this.buckets.get(key)
            if (!arr) { arr = []; this.buckets.set(key, arr) }
            arr.push(v)
        }

        // 趟2：用稳定快照计算目标速度（跟车 + 信号停止线）
        for (const v of this.vehicles) {
            if (!v.lane) continue
            const free = VEHICLE_BASE_SPEED
            let gap = this.leaderGap(v)
            if (signals) {
                const sg = signals.stopGap(v.x, v.z, v.dirIdx)
                if (sg < gap) gap = sg
            }
            let target: number
            if (gap < MIN_GAP) target = 0
            else if (gap < SAFE_GAP) target = free * (gap - MIN_GAP) / (SAFE_GAP - MIN_GAP)
            else target = free
            const cell = this.cellOf(v)
            const cong = cell >= 0 ? this.world.traffic[cell] : 0
            v.target = target * (1 - cong * 0.35)
        }

        // 趟3：推进 + 写矩阵 + 更新快照
        for (const v of this.vehicles) {
            if (!v.lane) continue
            if (v.speed < v.target) v.speed = Math.min(v.target, v.speed + VEHICLE_ACCEL * dt * speedMul)
            else v.speed = Math.max(v.target, v.speed - VEHICLE_ACCEL * 2 * dt * speedMul)

            v.s += v.speed * speedMul * dt
            if (v.s >= v.lane.total) { v.lane = null; v.field.set(v.id, HIDDEN); continue }
            v.seg = sampleLane(v.lane, v.s, v.seg, _out)
            v.x = _out[0]; v.z = _out[1]
            setDirProj(v, _out[2], _out[3])

            const yaw = Math.atan2(_out[2], _out[3])
            BABYLON.Quaternion.RotationYawPitchRollToRef(yaw, 0, 0, _q)
            _p.set(v.x, 0.12, v.z)
            BABYLON.Matrix.ComposeToRef(_s, _q, _p, _m)
            v.field.set(v.id, _m)
        }
        this.fields.forEach((f) => f.flush())
    }
}
