import * as BABYLON from 'babylonjs'
import { MAP_SIZE } from '@root/core/constants'
import { World } from '@root/core/world'
import { seedWorld } from '@root/core/seed'
import { SimClock } from '@root/core/clock'
import { stepTick } from '@root/sim/simulation'
import { MaterialLib } from '@root/render/materials'
import { CityRenderer } from '@root/render/cityRenderer'
import { loadModels } from '@root/render/modelLoader'
import { OverlayManager } from '@root/render/overlay'
import { InteractionController } from '@root/interaction/controller'
import { Vehicles } from '@root/agents/vehicles'
import { Hud } from '@root/ui/hud'
import { saveWorld, loadWorld } from '@root/persistence/save'
import { initMap } from '@root/model/map'
import { initCamera } from '@root/camera'

export interface Game {
    scene: BABYLON.Scene
    frame: (dt: number) => void
}

export const createScene = async (engine: BABYLON.Engine, canvas: HTMLCanvasElement): Promise<Game> => {
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0.62, 0.74, 0.85, 1)

    initMap(scene, MAP_SIZE, MAP_SIZE)
    initCamera(scene, canvas, MAP_SIZE, MAP_SIZE)

    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0.4, 1, 0.3), scene)
    light.intensity = 0.95
    const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.5, -1, -0.3), scene)
    sun.intensity = 0.5

    // —— 逻辑世界 ——
    const world = new World(20240603)
    seedWorld(world)

    // —— 渲染 / 交互 / UI ——
    const mats = new MaterialLib(scene)
    const models = await loadModels(scene)
    const renderer = new CityRenderer(scene, mats, models)
    renderer.initialSync(world)

    const overlay = new OverlayManager(scene)
    const controller = new InteractionController(scene, world)
    const vehicles = new Vehicles(scene, models, world)
    const clock = new SimClock()

    const resyncAll = (): void => {
        for (let c = 0; c < world.n; c++) world.renderDirty.add(c)
        renderer.sync(world)
        if (overlay.layer !== 0) overlay.update(world)
    }

    const hud = new Hud({
        world, controller, clock, overlay,
        save: () => saveWorld(world),
        load: () => { if (loadWorld(world)) resyncAll() },
    })

    const frame = (dt: number): void => {
        const prevDay = world.day
        clock.step(dt, world, stepTick)
        renderer.sync(world)
        vehicles.update(dt, clock.speed)
        if (overlay.layer !== 0 && world.day !== prevDay) overlay.update(world)
        hud.update()
    }

    // 调试句柄：便于控制台读取状态/快进模拟
    ;(window as unknown as { __city: unknown }).__city = {
        world, clock, overlay, controller,
        step: (nTicks: number) => { for (let i = 0; i < nTicks; i++) stepTick(world) },
        save: () => saveWorld(world),
        load: () => { if (loadWorld(world)) resyncAll() },
    }

    return { scene, frame }
}
