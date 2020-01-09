import * as BABYLON from 'babylonjs'

export enum ROAD_TYPE {
  HORIZONTAL,
  VERTICAL,
  CONNER,
  T_INTERSECTION,
  CROSSROAD,
}

export const ROAD_NAME = 'road'

const createHorizontalRoad = (
    scene: BABYLON.Scene,
    [shoulderMaterials, roadBedMaterials]: [BABYLON.StandardMaterial, BABYLON.StandardMaterial]
) => {
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
  rightShoulder.position = new BABYLON.Vector3(0, 0.01, 0.45)

  roadBed.position = new BABYLON.Vector3(0, 0.001, 0)
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
  return road
}

const createConnerRoad = (
    scene: BABYLON.Scene,
    [shoulderMaterials, roadBedMaterials]: [BABYLON.StandardMaterial, BABYLON.StandardMaterial]
) => {
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

  const shoulderConner = BABYLON.MeshBuilder.CreateBox(
      'shoulderConner',
      {
        width: 0.1,
        height: 0.02,
        depth: 0.1,
      },
      scene
  )
  shoulderConner.material = shoulderMaterials

  const roadBed = BABYLON.MeshBuilder.CreatePlane(
      'roadBed',
      {
        width: 0.9,
        height: 0.9,
      },
      scene
  )
  roadBed.material = roadBedMaterials

  shoulder.position = new BABYLON.Vector3(0, 0.01, -0.45)
  const topShoulder = shoulder.clone()
  topShoulder.rotation.y = Math.PI / 2
  topShoulder.position = new BABYLON.Vector3(-0.45, 0.01, 0)
  shoulderConner.position = new BABYLON.Vector3(0.45, 0.01, 0.45)

  roadBed.position = new BABYLON.Vector3(0.05, 0.001, 0.05)
  roadBed.rotation.x = Math.PI / 2

  const road = BABYLON.Mesh.MergeMeshes(
      [shoulder, topShoulder, roadBed, shoulderConner],
      true,
      true,
      undefined,
      false,
      true
  )
  road.name = ROAD_NAME
  return road
}

const createTIntersectionRoad = (
    scene: BABYLON.Scene,
    [shoulderMaterials, roadBedMaterials]: [BABYLON.StandardMaterial, BABYLON.StandardMaterial]
) => {
  const shoulder = BABYLON.MeshBuilder.CreateBox(
      'shoulder',
      {
        width: 1,
        height: 0.02,
        depth: 0.1,
      },
      scene
  )
  const shoulderConnerLeft = BABYLON.MeshBuilder.CreateBox(
      'shoulderConnerLeft',
      {
        width: 0.1,
        height: 0.02,
        depth: 0.1,
      },
      scene
  )
  shoulder.material = shoulderMaterials
  shoulderConnerLeft.material = shoulderMaterials

  const shoulderConnerRight = shoulderConnerLeft.clone()

  const roadBed = BABYLON.MeshBuilder.CreatePlane(
      'roadBed',
      {
        width: 1,
        height: 0.9,
      },
      scene
  )
  roadBed.material = roadBedMaterials

  shoulder.position = new BABYLON.Vector3(0, 0.01, -0.45)
  shoulderConnerLeft.position = new BABYLON.Vector3(0.45, 0.01, 0.45)
  shoulderConnerRight.position = new BABYLON.Vector3(-0.45, 0.01, 0.45)

  roadBed.position = new BABYLON.Vector3(0, 0.001, 0.05)
  roadBed.rotation.x = Math.PI / 2

  const road = BABYLON.Mesh.MergeMeshes(
      [shoulder, shoulderConnerLeft, shoulderConnerRight, roadBed],
      true,
      true,
      undefined,
      false,
      true
  )
  road.name = ROAD_NAME
  return road
}

const createCrossroadRoad = (
    scene: BABYLON.Scene,
    [shoulderMaterials, roadBedMaterials]: [BABYLON.StandardMaterial, BABYLON.StandardMaterial]
) => {
  const shoulderConnerA = BABYLON.MeshBuilder.CreateBox(
      'shoulderConner',
      {
        width: 0.1,
        height: 0.02,
        depth: 0.1,
      },
      scene
  )
  shoulderConnerA.material = shoulderMaterials
  const shoulderConnerB = shoulderConnerA.clone()
  const shoulderConnerC = shoulderConnerA.clone()
  const shoulderConnerD = shoulderConnerA.clone()

  const roadBed = BABYLON.MeshBuilder.CreatePlane(
      'roadBed',
      {
        width: 1,
        height: 1,
      },
      scene
  )
  roadBed.material = roadBedMaterials

  shoulderConnerA.position = new BABYLON.Vector3(0.45, 0.01, 0.45)
  shoulderConnerB.position = new BABYLON.Vector3(-0.45, 0.01, 0.45)
  shoulderConnerC.position = new BABYLON.Vector3(0.45, 0.01, -0.45)
  shoulderConnerD.position = new BABYLON.Vector3(-0.45, 0.01, -0.45)

  roadBed.position.y = 0.001
  roadBed.rotation.x = Math.PI / 2

  const road = BABYLON.Mesh.MergeMeshes(
      [
        roadBed,
        shoulderConnerA,
        shoulderConnerB,
        shoulderConnerC,
        shoulderConnerD,
      ],
      true,
      true,
      undefined,
      false,
      true
  )
  road.name = ROAD_NAME
  return road

}

export const createRoad = (
    scene: BABYLON.Scene,
    x: number,
    z: number,
    type: ROAD_TYPE = ROAD_TYPE.HORIZONTAL,
    rotate: number = 0
) => {

  const shoulderMaterials = new BABYLON.StandardMaterial('shoulder', scene)
  shoulderMaterials.diffuseColor = new BABYLON.Color3(0.83, 0.79, 0.77)

  const roadBedMaterials = new BABYLON.StandardMaterial('roadBed', scene)
  roadBedMaterials.diffuseColor = new BABYLON.Color3(0.43, 0.42, 0.44)

  let road: BABYLON.Mesh

  if ([ROAD_TYPE.HORIZONTAL, ROAD_TYPE.VERTICAL].includes(type)) {
    road = createHorizontalRoad(scene, [shoulderMaterials, roadBedMaterials])
    if (type === ROAD_TYPE.VERTICAL) {
      road.rotation.y = Math.PI / 2
    }
  }

  if (ROAD_TYPE.CONNER === type) {
    road = createConnerRoad(scene, [shoulderMaterials, roadBedMaterials])
  }

  if (ROAD_TYPE.T_INTERSECTION === type) {
    road = createTIntersectionRoad(scene, [shoulderMaterials, roadBedMaterials])
  }

  if (ROAD_TYPE.CROSSROAD === type) {
    road = createCrossroadRoad(scene, [shoulderMaterials, roadBedMaterials])
  }

  if (rotate) {
    road.rotation.y = rotate
  }

  road.position = new BABYLON.Vector3(x, 0, z)

  return road
}
