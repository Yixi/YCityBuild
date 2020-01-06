import * as BABYLON from 'babylonjs'
import { range, fill, chunk } from 'lodash'

export interface IMapData {
  x: number,
  y: number,
  mesh?: BABYLON.Mesh
}

class Store {
  map: IMapData[][]

  initMap = (width: number, height: number) => {
    this.map = chunk(
        range(width * height)
        .map((value) => {
          return {
            x: Math.floor(value / height),
            y: value % width,
          }
        }),
        width)
  }
}

export const store = new Store()
