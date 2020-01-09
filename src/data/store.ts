import * as BABYLON from 'babylonjs'
import { range, chunk } from 'lodash'
import { MESH_TYPE } from '@root/model/type'

export interface IMapData {
  x: number,
  y: number,
  mesh?: BABYLON.Mesh,
  meshType?: MESH_TYPE,
  info?: { [key: string]: any }
}

class Store {
  map: IMapData[][]
  road: Array<[number, number]> = [
    [45, 53],
    [44, 53],
    [44, 52],
    [46, 53],
    [46, 52],
    [46, 51],
    [46, 50],
    [47, 50],
    [48, 48],
    [48, 49],
    [48, 50],
    [48, 51],
    [48, 52],
    [49, 50],
    [50, 50],
    [51, 50],
    [51, 52],
    [51, 51],
    [52, 50],
    [53, 50],
    [53, 51],
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
