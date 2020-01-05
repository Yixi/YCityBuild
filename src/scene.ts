import * as BABYLON from 'babylonjs'

export const createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement) => {
  const scene = new BABYLON.Scene(engine)

  const ground = BABYLON.MeshBuilder.CreateGround('ground', {height: 100, width: 100, subdivisions: 9}, scene)
  const groundMaterial = new BABYLON.StandardMaterial('ground-material', scene)
  groundMaterial.diffuseColor = new BABYLON.Color3(0.462, 0.76, 0.404)
  ground.material = groundMaterial

  const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      Math.PI / 4,
      Math.PI / 180 * 70,
      40,
      BABYLON.Vector3.Zero(),
      scene
  )
  camera.attachControl(canvas, true)

  scene.createDefaultLight(true)
  // scene.createDefaultEnvironment()

  return scene

}
