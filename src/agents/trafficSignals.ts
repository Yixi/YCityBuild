import * as BABYLON from 'babylonjs'
import { World } from '@root/core/world'
import { RoadShape } from '@root/core/types'
import { InstanceField } from '@root/render/instanceField'
import { xOf, zOf } from '@root/core/grid'
import { MAP_SIZE, SIGNAL_GREEN_SEC, SIGNAL_YELLOW_SEC } from '@root/core/constants'

// 相位：0=南北绿 1=南北黄 2=东西绿 3=东西黄
interface Inter {
    cell: number
    x: number
    z: number
    phase: number
    timer: number
}

const DIR_VEC: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const PHASE_DUR = [SIGNAL_GREEN_SEC, SIGNAL_YELLOW_SEC, SIGNAL_GREEN_SEC, SIGNAL_YELLOW_SEC]

const _p = new BABYLON.Vector3()
const _one = new BABYLON.Vector3(1, 1, 1)
const _idq = BABYLON.Quaternion.Identity()
const _m = new BABYLON.Matrix()
const HIDDEN = BABYLON.Matrix.Scaling(0, 0, 0)

// 交叉口信号灯：识别十字路口，相位循环（南北↔东西），提供红灯停止线间距，并渲染三色灯头。
export class TrafficSignals {
    private inters: Inter[] = []
    private map: Map<number, Inter> = new Map()
    private greenField: InstanceField
    private redField: InstanceField
    private maxSlots = 0

    constructor(scene: BABYLON.Scene, private world: World) {
        const mk = (name: string, color: [number, number, number]): BABYLON.Mesh => {
            const b = BABYLON.MeshBuilder.CreateBox(name, { size: 0.16 }, scene)
            const m = new BABYLON.StandardMaterial(name + '-m', scene)
            m.emissiveColor = new BABYLON.Color3(color[0], color[1], color[2])
            m.disableLighting = true
            m.specularColor = new BABYLON.Color3(0, 0, 0)
            b.material = m
            b.isPickable = false
            b.alwaysSelectAsActiveMesh = true
            b.setEnabled(false)
            return b
        }
        this.greenField = new InstanceField(mk('sig-green', [0.2, 0.9, 0.25]), 256)
        this.redField = new InstanceField(mk('sig-red', [0.95, 0.2, 0.15]), 256)
    }

    private rebuild(): void {
        this.inters = []
        this.map.clear()
        const w = this.world
        for (let c = 0; c < w.n; c++) {
            if (w.road[c] === 1 && w.roadShape[c] === RoadShape.CROSSROAD) {
                const it: Inter = { cell: c, x: xOf(c), z: zOf(c), phase: (this.inters.length % 2) * 2, timer: 0 }
                this.inters.push(it)
                this.map.set(c, it)
            }
        }
    }

    private axisGreen(it: Inter, dirIdx: number): boolean {
        return dirIdx >= 2 ? it.phase === 0 : it.phase === 2
    }

    update(dt: number, speedMul: number): void {
        if (this.world.signalsDirty) { this.rebuild(); this.world.signalsDirty = false }
        if (speedMul > 0) {
            for (const it of this.inters) {
                it.timer += dt * speedMul
                while (it.timer >= PHASE_DUR[it.phase]) {
                    it.timer -= PHASE_DUR[it.phase]
                    it.phase = (it.phase + 1) % 4
                }
            }
        }
        this.render()
    }

    // 车辆到前方红灯停止线的间距；绿灯或前方非路口返回大值
    stopGap(x: number, z: number, dirIdx: number): number {
        const cx = Math.round(x)
        const cz = Math.round(z)
        const dv = DIR_VEC[dirIdx]
        const it = this.map.get((cx + dv[0]) * MAP_SIZE + (cz + dv[1]))
        if (!it) return 999
        if (this.axisGreen(it, dirIdx)) return 999
        let dist: number
        if (dirIdx === 0) dist = (cx + 0.5) - x
        else if (dirIdx === 1) dist = x - (cx - 0.5)
        else if (dirIdx === 2) dist = (cz + 0.5) - z
        else dist = z - (cz - 0.5)
        return Math.max(0, dist - 0.12)
    }

    private render(): void {
        let slot = 0
        const put = (hx: number, hz: number, green: boolean): void => {
            _p.set(hx, 0.55, hz)
            BABYLON.Matrix.ComposeToRef(_one, _idq, _p, _m)
            if (green) { this.greenField.set(slot, _m); this.redField.set(slot, HIDDEN) }
            else { this.redField.set(slot, _m); this.greenField.set(slot, HIDDEN) }
            slot++
        }
        for (const it of this.inters) {
            const nsGreen = this.axisGreen(it, 2)
            const ewGreen = this.axisGreen(it, 0)
            put(it.x, it.z + 0.42, nsGreen)
            put(it.x, it.z - 0.42, nsGreen)
            put(it.x + 0.42, it.z, ewGreen)
            put(it.x - 0.42, it.z, ewGreen)
        }
        // 隐藏上一帧多出的灯头（路口减少时）
        for (let s = slot; s < this.maxSlots; s++) {
            this.greenField.set(s, HIDDEN)
            this.redField.set(s, HIDDEN)
        }
        this.maxSlots = Math.max(this.maxSlots, slot)
        this.greenField.flush()
        this.redField.flush()
    }
}
