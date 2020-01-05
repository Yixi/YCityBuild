import * as BABYLON from 'babylonjs'
import { createTree } from '@root/model/tree'
import { random, range } from 'lodash'

let baseTree: BABYLON.Mesh

export const createTrees = (scene: BABYLON.Scene) => {

  if (!baseTree) {
    baseTree = createTree(scene)
    scene.removeMesh(baseTree)
  }

  range(random(40, 60)).forEach(() => {
    const tree = baseTree.clone()
    tree.position = new BABYLON.Vector3(
        random(-40, 40),
        0,
        random(-40, 40)
    )
    tree.addRotation(0, random(0, Math.PI, true), 0)
  })

  // const tree = baseTree.clone()
  // tree.position = new BABYLON.Vector3(1, 0, 0)

}
