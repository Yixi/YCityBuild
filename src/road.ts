import * as BABYLON from 'babylonjs'
import { createRoad, ROAD_NAME, ROAD_TYPE } from '@root/model/road'
import { store } from '@root/data/store'

export const buildRoads = (scene: BABYLON.Scene) => {

  const t = createRoad(scene, 46, 50, ROAD_TYPE.CONNER)
  store.map[46][50].info.type = ROAD_TYPE.CONNER
  store.map[46][50].mesh = t

  const t2 = createRoad(scene, 46, 53, ROAD_TYPE.CONNER, Math.PI)
  store.map[46][53].info.type = ROAD_TYPE.CONNER
  store.map[46][53].mesh = t

  store.road.forEach(([x, z]) => {
    const road = createRoad(scene, x, z)
    store.map[x][z].info.type = ROAD_TYPE.HORIZONTAL
    store.map[x][z].mesh = road

    if (
        store.map[x][z + 1].mesh?.name === ROAD_NAME ||
        store.map[x][z - 1].mesh?.name === ROAD_NAME
    ) {
      scene.removeMesh(store.map[x][z].mesh)
      store.map[x][z].mesh = createRoad(scene, x, z, ROAD_TYPE.VERTICAL)
      store.map[x][z].info.type = ROAD_TYPE.VERTICAL
    }
  })

}
