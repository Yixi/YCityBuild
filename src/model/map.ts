import * as BABYLON from 'babylonjs'
import { store } from '@root/data/store'
import { initCamera } from '@root/camera'

export const initMap = (scene: BABYLON.Scene, mapWidth: number, mapHeight: number) => {

  const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      {width: mapWidth, height: mapHeight},
      scene
  )
  const groundMaterial = new BABYLON.StandardMaterial('ground-material', scene)
  groundMaterial.diffuseColor = new BABYLON.Color3(0.462, 0.76, 0.404)
  ground.material = groundMaterial
  ground.position = new BABYLON.Vector3(mapWidth / 2, 0, mapHeight / 2)

  store.initMap(mapWidth, mapHeight)

}
