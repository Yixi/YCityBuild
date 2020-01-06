import * as BABYLON from 'babylonjs'
import { createTree } from '@root/model/tree'
import { random, range } from 'lodash'
import { store } from '@root/data/store'

let baseTree: BABYLON.Mesh

export const createTrees = (scene: BABYLON.Scene) => {

  if (!baseTree) {
    baseTree = createTree(scene)
    scene.removeMesh(baseTree)
  }

  range(random(100, 300)).forEach(() => {
    const tree = baseTree.clone()
    const x = random(10, 90)
    const z = random(10, 90)
    if (store.map[x][z].mesh) {
      scene.removeMesh(tree)
    } else {
      store.map[x][z].mesh = tree
      tree.position = new BABYLON.Vector3(x, 0, z)
      tree.addRotation(0, random(0, Math.PI, true), 0)
    }
  })
}
