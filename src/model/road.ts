import * as BABYLON from 'babylonjs'

export enum ROAD_TYPE {
  HORIZONTAL,
  VERTICAL,
  T_INTERSECTION,
  CROSSROAD,
}

export const ROAD_NAME = 'road'

export const createRoad = (scene: BABYLON.Scene, x: number, z: number, type: ROAD_TYPE = ROAD_TYPE.HORIZONTAL) => {

  const shoulderMaterials = new BABYLON.StandardMaterial('shoulder', scene)
  shoulderMaterials.diffuseColor = new BABYLON.Color3(0.83, 0.79, 0.77)

  const roadBedMaterials = new BABYLON.StandardMaterial('roadBed', scene)
  roadBedMaterials.diffuseColor = new BABYLON.Color3(0.43, 0.42, 0.44)

  const shoulder = BABYLON.MeshBuilder.CreateBox(
      'shoulder',
      {
        width: 1,
        height: 0.02,
        depth: 0.1,
      },
      scene
  )
  shoulder.material = shoulderMaterials
  const rightShoulder = shoulder.clone()

  const roadBed = BABYLON.MeshBuilder.CreatePlane(
      'roadBed',
      {
        width: 1,
        size: 0.8,
      },
      scene
  )
  roadBed.material = roadBedMaterials

  shoulder.position = new BABYLON.Vector3(0, 0.01, -0.45)
  rightShoulder.position = new BABYLON.Vector3(0, 0.01,  0.45)

  roadBed.position = new BABYLON.Vector3(0, 0.001,  0)
  roadBed.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0)

  const road = BABYLON.Mesh.MergeMeshes(
      [shoulder, rightShoulder, roadBed],
      true,
      true,
      undefined,
      false,
      true
  )
  road.name = ROAD_NAME
  road.position= new BABYLON.Vector3(x, 0, z)

  if (type === ROAD_TYPE.VERTICAL) {
    road.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0)
  }

  return road
}
