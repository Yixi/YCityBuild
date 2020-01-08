import * as BABYLON from 'babylonjs'
import { range, fill, chunk } from 'lodash'

export interface IMapData {
  x: number,
  y: number,
  mesh?: BABYLON.Mesh,
  info?: { [key: string]: any }
}

class Store {
  map: IMapData[][]
  road: Array<[number, number]> = [
    [45, 53],
    [44, 53],
    [46, 53],
    [46, 52],
    [46, 51],
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
            info: {},
          }
        }),
        width)
  }
}

export const store = new Store()
