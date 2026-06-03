import * as BABYLON from 'babylonjs'
import { World } from '@root/core/world'
import { MAP_SIZE } from '@root/core/constants'
import { COVERAGE_SERVICES } from '@root/core/serviceDefs'

export enum OverlayLayer {
    NONE,
    POWER,
    WATER,
    POLLUTION,
    LANDVALUE,
    TRAFFIC,
    SERVICES,
}

export const OVERLAY_LABELS: Record<OverlayLayer, string> = {
    [OverlayLayer.NONE]: '无',
    [OverlayLayer.POWER]: '电力',
    [OverlayLayer.WATER]: '供水',
    [OverlayLayer.POLLUTION]: '污染',
    [OverlayLayer.LANDVALUE]: '地价',
    [OverlayLayer.TRAFFIC]: '交通',
    [OverlayLayer.SERVICES]: '服务',
}

// 一张铺在地面上方的 RawTexture（1 像素=1 格），按当前图层逐格着色。1 draw call。
export class OverlayManager {
    layer: OverlayLayer = OverlayLayer.NONE
    private data: Uint8Array
    private tex: BABYLON.RawTexture
    private plane: BABYLON.Mesh

    constructor(scene: BABYLON.Scene) {
        const size = MAP_SIZE
        this.data = new Uint8Array(size * size * 4)
        this.tex = BABYLON.RawTexture.CreateRGBATexture(
            this.data, size, size, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE
        )
        this.tex.hasAlpha = true

        const mat = new BABYLON.StandardMaterial('overlay-mat', scene)
        mat.diffuseTexture = this.tex
        mat.emissiveTexture = this.tex
        mat.useAlphaFromDiffuseTexture = true
        mat.disableLighting = true
        mat.backFaceCulling = false
        mat.specularColor = new BABYLON.Color3(0, 0, 0)

        this.plane = BABYLON.MeshBuilder.CreateGround('overlay', { width: size, height: size }, scene)
        this.plane.material = mat
        this.plane.position = new BABYLON.Vector3(size / 2, 0.06, size / 2)
        this.plane.isPickable = false
        this.plane.setEnabled(false)
    }

    setLayer(layer: OverlayLayer, world: World): void {
        this.layer = layer
        this.plane.setEnabled(layer !== OverlayLayer.NONE)
        if (layer !== OverlayLayer.NONE) this.update(world)
    }

    private servicesScore(world: World, cell: number): number {
        let sum = 0
        for (const s of COVERAGE_SERVICES) sum += world.coverage[s][cell]
        return sum / COVERAGE_SERVICES.length
    }

    private colorAt(world: World, cell: number, out: number[]): void {
        out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 0
        const hasBuilding = world.buildingId[cell] >= 0
        const isRoad = world.road[cell] === 1
        switch (this.layer) {
            case OverlayLayer.POWER:
                if (hasBuilding || isRoad) {
                    if (world.powered[cell]) { out[1] = 220; out[0] = 40 } else { out[0] = 220; out[1] = 30 }
                    out[3] = 150
                }
                break
            case OverlayLayer.WATER:
                if (hasBuilding || isRoad) {
                    if (world.watered[cell]) { out[2] = 230; out[1] = 120 } else { out[0] = 220; out[1] = 30 }
                    out[3] = 150
                }
                break
            case OverlayLayer.POLLUTION: {
                const p = Math.min(1, world.pollution[cell] / 180)
                if (p > 0.02) { out[0] = 60 + Math.floor(p * 195); out[1] = Math.floor(120 * (1 - p)); out[3] = Math.floor(40 + p * 160) }
                break
            }
            case OverlayLayer.LANDVALUE: {
                const v = Math.min(1, world.landValue[cell] / 200)
                out[0] = Math.floor(40 * (1 - v)); out[1] = Math.floor(80 + v * 175); out[2] = 60; out[3] = 130
                break
            }
            case OverlayLayer.TRAFFIC:
                if (isRoad) {
                    const t = world.traffic[cell]
                    out[0] = Math.floor(40 + t * 215); out[1] = Math.floor(200 * (1 - t)); out[3] = 170
                }
                break
            case OverlayLayer.SERVICES: {
                const s = this.servicesScore(world, cell)
                if (s > 0.02) { out[2] = 120 + Math.floor(s * 135); out[1] = Math.floor(s * 120); out[3] = Math.floor(40 + s * 160) }
                break
            }
            default:
                break
        }
    }

    update(world: World): void {
        if (this.layer === OverlayLayer.NONE) return
        const size = MAP_SIZE
        const out = [0, 0, 0, 0]
        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                const cell = x * size + z
                this.colorAt(world, cell, out)
                const px = (z * size + x) * 4
                this.data[px] = out[0]
                this.data[px + 1] = out[1]
                this.data[px + 2] = out[2]
                this.data[px + 3] = out[3]
            }
        }
        this.tex.update(this.data)
    }
}
