import * as BABYLON from 'babylonjs'
import { range, fill, chunk } from 'lodash'

export interface IMapData {
  x: number,
  y: number,
  mesh?: BABYLON.Mesh
}

class Store {
  map: IMapData[][]
  road: Array<[number, number]> = [
    [46, 50],
    [47, 50],
    [48, 50],
    [49, 50],
    [50, 50],
    [51, 50],
    [52, 50],
    [53, 50],
  ]

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
