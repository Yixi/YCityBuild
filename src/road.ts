import * as BABYLON from 'babylonjs'
import { createRoad } from '@root/model/road'
import { store } from '@root/data/store'

export const buildRoads = (scene: BABYLON.Scene) => {

  store.road.forEach(([x, z]) => {
    const road = createRoad(scene, x, z)
    store.map[x][z].mesh = road
  })

}
