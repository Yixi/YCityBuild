import { MAP_SIZE } from '@root/core/constants'

// 网格索引工具：idx = x * MAP_SIZE + z，与 demo 的 map[x][z] 访问语义一致。
// x / z 为水平面坐标，y 为高度。

export const inBounds = (x: number, z: number): boolean =>
    x >= 0 && z >= 0 && x < MAP_SIZE && z < MAP_SIZE

export const idx = (x: number, z: number): number => x * MAP_SIZE + z

export const xOf = (i: number): number => Math.floor(i / MAP_SIZE)

export const zOf = (i: number): number => i % MAP_SIZE

// 四邻居顺序固定为 [右(+x), 上(-z), 左(-x), 下(+z)]，与原 calculateRoadType 依赖一致。
export const NEIGHBORS: Array<[number, number]> = [
    [1, 0],
    [0, -1],
    [-1, 0],
    [0, 1],
]

// 返回某格四邻居的 idx（越界为 -1）
export const neighborsOf = (i: number): number[] => {
    const x = xOf(i)
    const z = zOf(i)
    const out: number[] = []
    for (const [dx, dz] of NEIGHBORS) {
        const nx = x + dx
        const nz = z + dz
        out.push(inBounds(nx, nz) ? idx(nx, nz) : -1)
    }
    return out
}
