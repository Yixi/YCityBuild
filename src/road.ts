import * as BABYLON from 'babylonjs'
import { createRoad, ROAD_TYPE } from '@root/model/road'
import { store } from '@root/data/store'
import { MESH_TYPE } from '@root/model/type'

const initRoadData = () => {
  store.road.forEach(([x, z]) => {
    store.map[x][z].meshType = MESH_TYPE.ROAD
  })
}

const calculateRoadType = ([x, z]: [number, number]) => {
  const around = [
    store.map[x + 1][z].meshType,
    store.map[x][z - 1].meshType,
    store.map[x - 1][z].meshType,
    store.map[x][z + 1].meshType,
  ]

  const roads = around.filter((type) => type === MESH_TYPE.ROAD)
  const roadInfo = store.map[x][z].info as { type?: ROAD_TYPE, rotate?: number }

  if (roads.length === 4) {
    roadInfo.type = ROAD_TYPE.CROSSROAD
  } else if (roads.length === 3) {
    roadInfo.type = ROAD_TYPE.T_INTERSECTION
    roadInfo.rotate = calculateRotationForTIntersection(around)
  } else if (roads.length === 2) {
    if (around[0] === MESH_TYPE.ROAD && around[2] === MESH_TYPE.ROAD) {
      roadInfo.type = ROAD_TYPE.HORIZONTAL
    } else if (around[1] === MESH_TYPE.ROAD && around[3] === MESH_TYPE.ROAD) {
      roadInfo.type = ROAD_TYPE.VERTICAL
    } else {
      roadInfo.type = ROAD_TYPE.CONNER
      if (around[0] === MESH_TYPE.ROAD && around[1] === MESH_TYPE.ROAD) {
        roadInfo.rotate = Math.PI / 2
      } else if (around[0] === MESH_TYPE.ROAD && around[3] === MESH_TYPE.ROAD) {
        roadInfo.rotate = Math.PI * 2
      } else if (around[1] === MESH_TYPE.ROAD && around[2] === MESH_TYPE.ROAD) {
        roadInfo.rotate = Math.PI
      } else if (around[2] === MESH_TYPE.ROAD && around[3] === MESH_TYPE.ROAD) {
        roadInfo.rotate = Math.PI / 2 * 3
      }
    }

  } else if (roads.length === 1) {
    if (around[0] === MESH_TYPE.ROAD || around[2] === MESH_TYPE.ROAD) {
      roadInfo.type = ROAD_TYPE.HORIZONTAL
    } else {
      roadInfo.type = ROAD_TYPE.VERTICAL
    }
  }

}

const calculateRotationForTIntersection = (around: MESH_TYPE[]) => {
  const isRoad = around.map((type) => type === MESH_TYPE.ROAD )
  if (!isRoad[1]) {
    return 0
  }
  if (!isRoad[2]) {
    return Math.PI / 2
  }
  if (!isRoad[3]) {
    return Math.PI
  }
  if (!isRoad[0]) {
    return Math.PI / 2 * 3
  }
  return 0
}

export const buildRoads = (scene: BABYLON.Scene) => {
  initRoadData()

  store.road.forEach(calculateRoadType)
  store.road.forEach(([x, z]) => {
    store.map[x][z].mesh = createRoad(
        scene,
        x,
        z,
        store.map[x][z].info.type,
        store.map[x][z].info.rotate
    )
  })

}

const rebuildRoad = (x: number, z: number, scene: BABYLON.Scene) => {
  calculateRoadType([x, z])
  if (store.map[x][z].mesh) {
    store.map[x][z].mesh.dispose()
  }
  store.map[x][z].mesh = createRoad(
    scene,
    x,
    z,
    store.map[x][z].info.type,
    store.map[x][z].info.rotate
  )
}

const rebuildSurroundingArea = (x: number, z: number, scene: BABYLON.Scene) => {
  for (let i = x-1; i <= x+1; i++ ) {
    for (let j = z-1; j <= z+1; j++) {
      if(store.map[i][j].meshType === MESH_TYPE.ROAD) {
        rebuildRoad(i, j, scene)
      }
    }
  }
}

export const clickToBuildRoad = (scene: BABYLON.Scene) => {
  scene.onPointerObservable.add((pointerInfo: BABYLON.PointerInfo) => {
    switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERTAP:
            const x: number = Math.round(pointerInfo.pickInfo.pickedPoint.x)
            const z: number = Math.round(pointerInfo.pickInfo.pickedPoint.z)
            store.map[x][z].meshType = MESH_TYPE.ROAD
            rebuildSurroundingArea(x, z, scene)
            break
    }
})

}
