import * as BABYLON from 'babylonjs'

export const initCamera = (
    scene: BABYLON.Scene,
    canvas: HTMLCanvasElement,
    mapWidth: number,
    mapHeight: number
) => {
  const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      Math.PI / 4,
      Math.PI / 180 * 75,
      20,
      new BABYLON.Vector3(mapWidth / 2, 0, mapHeight / 2),
      scene
  )

  camera.attachControl(canvas, true)

}
