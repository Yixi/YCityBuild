import * as BABYLON from 'babylonjs'

export const createTree = (scene: BABYLON.Scene) => {

  const trunkMaterials = new BABYLON.StandardMaterial('trunk', scene)
  trunkMaterials.diffuseColor = new BABYLON.Color3(0.37, 0.27, 0.207)

  const leafMaterials = new BABYLON.StandardMaterial('leaf', scene)
  leafMaterials.diffuseColor = new BABYLON.Color3(0.3, 0.45, 0.24)

  const trunkHeight = 0.7
  const leafHeight = 1.0

  const trunk = BABYLON.MeshBuilder.CreateBox(
      'trunk',
      {size: 0.2, height: trunkHeight},
      scene
  )
  trunk.material = trunkMaterials
  trunk.position = new BABYLON.Vector3(0, trunkHeight / 2, 0)

  const leaf = BABYLON.MeshBuilder.CreateBox(
      'leaf',
      {size: 0.6, height: leafHeight},
      scene
  )
  leaf.material = leafMaterials
  leaf.position = new BABYLON.Vector3(0, trunkHeight + leafHeight / 2 , 0)

  return BABYLON.Mesh.MergeMeshes(
      [trunk, leaf],
      true,
      true,
      undefined,
      false,
      true
  )
}
