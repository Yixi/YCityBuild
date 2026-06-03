import { World } from '@root/core/world'
import { RoadShape } from '@root/core/types'
import { idx, xOf, zOf, inBounds } from '@root/core/grid'

// 读取某格四邻居是否为道路，顺序固定 [右(+x), 上(-z), 左(-x), 下(+z)]，
// 与原 demo calculateRoadType 完全一致（旋转计算依赖此顺序）。
const aroundRoads = (world: World, cell: number): boolean[] => {
    const x = xOf(cell)
    const z = zOf(cell)
    const read = (nx: number, nz: number): boolean =>
        inBounds(nx, nz) && world.road[idx(nx, nz)] === 1
    return [
        read(x + 1, z),
        read(x, z - 1),
        read(x - 1, z),
        read(x, z + 1),
    ]
}

const tIntersectionRotation = (a: boolean[]): number => {
    if (!a[1]) return 0
    if (!a[2]) return Math.PI / 2
    if (!a[3]) return Math.PI
    if (!a[0]) return Math.PI / 2 * 3
    return 0
}

// 根据邻居重算单格的道路外观与旋转，写回 world.roadShape / world.roadRot。
// 注意：VERTICAL 不单独建原型，渲染层用 HORIZONTAL 原型旋转 90°，故这里 rot 仅 CONNER/T 有值。
export const recomputeRoad = (world: World, cell: number): void => {
    if (world.road[cell] !== 1) return
    const a = aroundRoads(world, cell)
    const count = (a[0] ? 1 : 0) + (a[1] ? 1 : 0) + (a[2] ? 1 : 0) + (a[3] ? 1 : 0)
    let shape = RoadShape.HORIZONTAL
    let rot = 0

    if (count === 4) {
        shape = RoadShape.CROSSROAD
    } else if (count === 3) {
        shape = RoadShape.T_INTERSECTION
        rot = tIntersectionRotation(a)
    } else if (count === 2) {
        if (a[0] && a[2]) {
            shape = RoadShape.HORIZONTAL
        } else if (a[1] && a[3]) {
            shape = RoadShape.VERTICAL
        } else {
            shape = RoadShape.CONNER
            if (a[0] && a[1]) rot = Math.PI / 2
            else if (a[0] && a[3]) rot = Math.PI * 2
            else if (a[1] && a[2]) rot = Math.PI
            else if (a[2] && a[3]) rot = Math.PI / 2 * 3
        }
    } else if (count === 1) {
        shape = (a[0] || a[2]) ? RoadShape.HORIZONTAL : RoadShape.VERTICAL
    }

    world.roadShape[cell] = shape
    world.roadRot[cell] = rot
}

// 重算某格及其四邻居中所有道路格的外观（建造/拆除后调用），并标记渲染脏。
export const recomputeRoadArea = (world: World, cell: number): void => {
    const x = xOf(cell)
    const z = zOf(cell)
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            const nx = x + dx
            const nz = z + dz
            if (!inBounds(nx, nz)) continue
            const ni = idx(nx, nz)
            if (world.road[ni] === 1) {
                recomputeRoad(world, ni)
                world.markRender(ni)
            }
        }
    }
}

// 找到某格相邻的一个道路格（用于建筑临路判定），无则返回 -1
export const roadNeighbor = (world: World, cell: number): number => {
    const x = xOf(cell)
    const z = zOf(cell)
    const dirs: Array<[number, number]> = [[1, 0], [0, -1], [-1, 0], [0, 1]]
    for (const [dx, dz] of dirs) {
        const nx = x + dx
        const nz = z + dz
        if (inBounds(nx, nz) && world.road[idx(nx, nz)] === 1) return idx(nx, nz)
    }
    return -1
}
