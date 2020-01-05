import * as BABYLON from 'babylonjs'
import { createScene } from '@root/scene'
import { createTrees } from '@root/trees'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
const fps = document.getElementById('fps')

const engine = new BABYLON.Engine(canvas, true)

const scene = createScene(engine, canvas)

createTrees(scene)

engine.runRenderLoop(() => {
  scene.render()
  fps.textContent = engine.getFps().toFixed()
})
