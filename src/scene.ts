import * as BABYLON from 'babylonjs'
import { initMap } from '@root/model/map'
import { buildTrees } from '@root/trees'
import { initCamera } from '@root/camera'
import { buildRoads } from '@root/road'

export const createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement) => {
  const scene = new BABYLON.Scene(engine)

  initMap(scene, 100, 100)
  initCamera(scene, canvas, 100, 100)

  scene.createDefaultLight(true)
  // scene.createDefaultEnvironment()

  buildRoads(scene)
  buildTrees(scene)

  return scene

}
