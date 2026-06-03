import * as BABYLON from 'babylonjs'
import { World } from '@root/core/world'
import { RoadShape } from '@root/core/types'
import { InstanceField } from '@root/render/instanceField'
import { xOf, zOf, idx, inBounds } from '@root/core/grid'
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
const HEAD_Y = 0.6

// 交叉口控制：十字用信号灯（相位循环），丁字用让行（主路优先、次路停让）。含三色灯头 + 灯杆渲染。
export class TrafficSignals {
    private inters: Inter[] = []
    private map: Map<number, Inter> = new Map()         // 十字路口
    private tMap: Map<number, number> = new Map()       // 丁字路口 → 主路轴(0水平/1垂直)
    private greenField: InstanceField
    private redField: InstanceField
    private poleField: InstanceField
    private maxSlots = 0

    constructor(scene: BABYLON.Scene, private world: World) {
        const head = (name: string, color: [number, number, number]): BABYLON.Mesh => {
            const b = BABYLON.MeshBuilder.CreateBox(name, { size: 0.11 }, scene)
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
        // 灯杆：细长盒，基座 y=0，高 HEAD_Y
        const pole = BABYLON.MeshBuilder.CreateBox('sig-pole', { width: 0.045, height: HEAD_Y, depth: 0.045 }, scene)
        const pm = new BABYLON.StandardMaterial('sig-pole-m', scene)
        pm.diffuseColor = new BABYLON.Color3(0.25, 0.26, 0.28)
        pm.specularColor = new BABYLON.Color3(0, 0, 0)
        pole.material = pm
        pole.position.y = HEAD_Y / 2
        pole.bakeCurrentTransformIntoVertices()
        pole.isPickable = false
        pole.alwaysSelectAsActiveMesh = true
        pole.setEnabled(false)

        this.greenField = new InstanceField(head('sig-green', [0.2, 0.9, 0.25]), 256)
        this.redField = new InstanceField(head('sig-red', [0.95, 0.2, 0.15]), 256)
        this.poleField = new InstanceField(pole, 256)
    }

    private rebuild(): void {
        this.inters = []
        this.map.clear()
        this.tMap.clear()
        const w = this.world
        const road = (x: number, z: number): boolean => inBounds(x, z) && w.road[idx(x, z)] === 1
        for (let c = 0; c < w.n; c++) {
            if (w.road[c] !== 1) continue
            const shape = w.roadShape[c]
            if (shape === RoadShape.CROSSROAD) {
                const it: Inter = { cell: c, x: xOf(c), z: zOf(c), phase: (this.inters.length % 2) * 2, timer: 0 }
                this.inters.push(it)
                this.map.set(c, it)
            } else if (shape === RoadShape.T_INTERSECTION) {
                const x = xOf(c)
                const z = zOf(c)
                // 主路轴 = 两侧都有路的那个轴（0=水平 E/W，1=垂直 N/S）
                const priorityAxis = (road(x + 1, z) && road(x - 1, z)) ? 0 : 1
                this.tMap.set(c, priorityAxis)
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

    private stopLine(x: number, z: number, dirIdx: number): number {
        const cx = Math.round(x)
        const cz = Math.round(z)
        let dist: number
        if (dirIdx === 0) dist = (cx + 0.5) - x
        else if (dirIdx === 1) dist = x - (cx - 0.5)
        else if (dirIdx === 2) dist = (cz + 0.5) - z
        else dist = z - (cz - 0.5)
        return Math.max(0, dist - 0.12)
    }

    // 到前方路口停止线的间距：十字红灯停；丁字次路在路口被占用时停。occupied(cell)由车辆层提供。
    stopGap(x: number, z: number, dirIdx: number, occupied: (cell: number) => boolean): number {
        const cx = Math.round(x)
        const cz = Math.round(z)
        const dv = DIR_VEC[dirIdx]
        const ncell = (cx + dv[0]) * MAP_SIZE + (cz + dv[1])

        const it = this.map.get(ncell)
        if (it) {
            if (this.axisGreen(it, dirIdx)) return 999
            return this.stopLine(x, z, dirIdx)
        }
        const pa = this.tMap.get(ncell)
        if (pa !== undefined) {
            const myAxis = dirIdx < 2 ? 0 : 1
            if (myAxis !== pa && occupied(ncell)) return this.stopLine(x, z, dirIdx)
            return 999
        }
        return 999
    }

    private render(): void {
        let slot = 0
        const put = (hx: number, hz: number, green: boolean): void => {
            _p.set(hx, HEAD_Y, hz)
            BABYLON.Matrix.ComposeToRef(_one, _idq, _p, _m)
            if (green) { this.greenField.set(slot, _m); this.redField.set(slot, HIDDEN) }
            else { this.redField.set(slot, _m); this.greenField.set(slot, HIDDEN) }
            _p.set(hx, 0, hz)
            BABYLON.Matrix.ComposeToRef(_one, _idq, _p, _m)
            this.poleField.set(slot, _m)
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
        for (let s = slot; s < this.maxSlots; s++) {
            this.greenField.set(s, HIDDEN)
            this.redField.set(s, HIDDEN)
            this.poleField.set(s, HIDDEN)
        }
        this.maxSlots = Math.max(this.maxSlots, slot)
        this.greenField.flush()
        this.redField.flush()
        this.poleField.flush()
    }
}
