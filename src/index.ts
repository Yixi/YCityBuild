import * as BABYLON from 'babylonjs'
import { createScene } from '@root/scene'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
const fps = document.getElementById('fps')

const engine = new BABYLON.Engine(canvas, true)
const game = createScene(engine, canvas)

engine.runRenderLoop(() => {
    const dt = engine.getDeltaTime() / 1000
    game.frame(dt)
    game.scene.render()
    if (fps) fps.textContent = engine.getFps().toFixed() + ' fps'
})

window.addEventListener('resize', () => engine.resize())
