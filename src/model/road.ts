import * as BABYLON from 'babylonjs'

export const createRoad = (scene: BABYLON.Scene, x: number, z: number) => {

  const shoulderMaterials = new BABYLON.StandardMaterial('shoulder', scene)
  shoulderMaterials.diffuseColor = new BABYLON.Color3(0.83, 0.79, 0.77)

  const roadBedMaterials = new BABYLON.StandardMaterial('roadBed', scene)
  roadBedMaterials.diffuseColor = new BABYLON.Color3(0.43, 0.42, 0.44)

  const shoulder = BABYLON.MeshBuilder.CreateBox(
      'shoulder',
      {
        width: 1,
        height: 0.02,
        depth: 0.08,
      },
      scene
  )
  shoulder.material = shoulderMaterials
  const rightShoulder = shoulder.clone()

  const roadBed = BABYLON.MeshBuilder.CreatePlane(
      'roadBed',
      {
        width: 1,
        size: 0.72,
      },
      scene
  )
  roadBed.material = roadBedMaterials

  shoulder.position = new BABYLON.Vector3(x, 0.01, z)
  rightShoulder.position = new BABYLON.Vector3(x, 0.01, z + 0.8)
  roadBed.position = new BABYLON.Vector3(x, 0.001, z + 0.4)
  roadBed.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0)

  return BABYLON.Mesh.MergeMeshes(
      [shoulder, rightShoulder, roadBed],
      true,
      true,
      undefined,
      false,
      true
  )
}
