import * as BABYLON from 'babylonjs'
import { World } from '@root/core/world'
import { ServiceType, ToolId, ZoneType } from '@root/core/types'
import { idx, inBounds, xOf, zOf } from '@root/core/grid'
import { buildRoad, setZone, placeService, demolish } from '@root/core/commands'

// 交互控制器：唯一的指针订阅者，按当前工具把 down/move/up 转成建造指令；左键建造、右键由相机旋转。
export class InteractionController {
    activeTool: ToolId = ToolId.QUERY
    serviceType: ServiceType = ServiceType.POWER
    hoverCell = -1

    private dragging = false
    private lastCell = -1
    private hoverMarker: BABYLON.Mesh
    private selectMarker: BABYLON.Mesh

    constructor(
        private scene: BABYLON.Scene,
        private world: World
    ) {
        this.hoverMarker = this.makeMarker('hover-marker', [1, 1, 1], 0.18)
        this.selectMarker = this.makeMarker('select-marker', [1, 0.9, 0.2], 0.32)
        scene.onPointerObservable.add((info: BABYLON.PointerInfo) => this.onPointer(info))
    }

    setTool(t: ToolId): void {
        this.activeTool = t
    }

    setService(s: ServiceType): void {
        this.serviceType = s
        this.activeTool = ToolId.SERVICE
    }

    private makeMarker(name: string, color: [number, number, number], alpha: number): BABYLON.Mesh {
        const m = BABYLON.MeshBuilder.CreateBox(name, { width: 1, height: 0.12, depth: 1 }, this.scene)
        const mat = new BABYLON.StandardMaterial(name + '-mat', this.scene)
        mat.diffuseColor = new BABYLON.Color3(color[0], color[1], color[2])
        mat.emissiveColor = new BABYLON.Color3(color[0] * 0.6, color[1] * 0.6, color[2] * 0.6)
        mat.specularColor = new BABYLON.Color3(0, 0, 0)
        mat.alpha = alpha
        m.material = mat
        m.isPickable = false
        m.position.y = 0.07
        m.setEnabled(false)
        return m
    }

    private pickCell(): number {
        const pi = this.scene.pick(this.scene.pointerX, this.scene.pointerY,
            (mesh: BABYLON.AbstractMesh) => mesh.name === 'ground')
        if (!pi || !pi.hit || !pi.pickedPoint) return -1
        const x = Math.round(pi.pickedPoint.x)
        const z = Math.round(pi.pickedPoint.z)
        return inBounds(x, z) ? idx(x, z) : -1
    }

    private isDragTool(t: ToolId): boolean {
        return t === ToolId.ROAD || t === ToolId.ZONE_R || t === ToolId.ZONE_C
            || t === ToolId.ZONE_I || t === ToolId.BULLDOZE
    }

    private applyCell(cell: number): void {
        const w = this.world
        switch (this.activeTool) {
            case ToolId.ROAD: buildRoad(w, cell); break
            case ToolId.ZONE_R: setZone(w, cell, ZoneType.R); break
            case ToolId.ZONE_C: setZone(w, cell, ZoneType.C); break
            case ToolId.ZONE_I: setZone(w, cell, ZoneType.I); break
            case ToolId.BULLDOZE: demolish(w, cell); break
            case ToolId.SERVICE: placeService(w, cell, this.serviceType); break
            default: break
        }
    }

    // Bresenham：填补拖拽过程中跳过的格子，避免断点
    private paintLine(from: number, to: number): void {
        let x0 = xOf(from)
        let z0 = zOf(from)
        const x1 = xOf(to)
        const z1 = zOf(to)
        const dx = Math.abs(x1 - x0)
        const dz = Math.abs(z1 - z0)
        const sx = x0 < x1 ? 1 : -1
        const sz = z0 < z1 ? 1 : -1
        let err = dx - dz
        for (;;) {
            this.applyCell(idx(x0, z0))
            if (x0 === x1 && z0 === z1) break
            const e2 = 2 * err
            if (e2 > -dz) { err -= dz; x0 += sx }
            if (e2 < dx) { err += dx; z0 += sz }
        }
    }

    private select(cell: number): void {
        this.world.selection = cell
        this.selectMarker.position.x = xOf(cell)
        this.selectMarker.position.z = zOf(cell)
        this.selectMarker.setEnabled(true)
    }

    private onPointer(info: BABYLON.PointerInfo): void {
        const ev = info.event as PointerEvent
        switch (info.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN: {
                if (ev.button !== 0) return
                const cell = this.pickCell()
                if (cell < 0) return
                if (this.isDragTool(this.activeTool)) {
                    this.dragging = true
                    this.lastCell = cell
                    this.applyCell(cell)
                } else if (this.activeTool === ToolId.SERVICE) {
                    this.applyCell(cell)
                } else {
                    this.select(cell)
                }
                break
            }
            case BABYLON.PointerEventTypes.POINTERMOVE: {
                const cell = this.pickCell()
                this.hoverCell = cell
                if (cell >= 0) {
                    this.hoverMarker.position.x = xOf(cell)
                    this.hoverMarker.position.z = zOf(cell)
                    this.hoverMarker.setEnabled(true)
                } else {
                    this.hoverMarker.setEnabled(false)
                }
                if (this.dragging && cell >= 0 && cell !== this.lastCell) {
                    this.paintLine(this.lastCell, cell)
                    this.lastCell = cell
                }
                break
            }
            case BABYLON.PointerEventTypes.POINTERUP: {
                this.dragging = false
                break
            }
            default:
                break
        }
    }
}
