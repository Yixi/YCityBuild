import { World } from '@root/core/world'
import { MAP_SIZE } from '@root/core/constants'

export const clamp = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v

// 返回某格四邻居的有效 idx（越界跳过）
export const neighbors4 = (cell: number): number[] => {
    const x = Math.floor(cell / MAP_SIZE)
    const z = cell % MAP_SIZE
    const out: number[] = []
    if (x + 1 < MAP_SIZE) out.push((x + 1) * MAP_SIZE + z)
    if (z - 1 >= 0) out.push(x * MAP_SIZE + (z - 1))
    if (x - 1 >= 0) out.push((x - 1) * MAP_SIZE + z)
    if (z + 1 < MAP_SIZE) out.push(x * MAP_SIZE + (z + 1))
    return out
}

// —— 复用式道路 BFS（基于代际戳，避免每次重置大数组）——
let _n = -1
let _distStamp: Int32Array
let _dist: Int32Array
let _parent: Int32Array
let _queue: Int32Array
let _gen = 0

const ensure = (n: number): void => {
    if (_n === n) return
    _n = n
    _distStamp = new Int32Array(n)
    _dist = new Int32Array(n)
    _parent = new Int32Array(n)
    _queue = new Int32Array(n)
}

export interface BfsResult {
    stamp: number
    distStamp: Int32Array
    dist: Int32Array
    parent: Int32Array   // 指向更靠近源的邻居，用于回溯
    order: Int32Array     // 按访问顺序的格子
    count: number
}

// 在道路图（road==1）上从多个源做 BFS，最远 maxDist 步。
export const bfsRoad = (world: World, sources: number[], maxDist: number): BfsResult => {
    ensure(world.n)
    _gen++
    let head = 0
    let tail = 0
    for (const s of sources) {
        if (s < 0 || world.road[s] !== 1) continue
        if (_distStamp[s] === _gen) continue
        _distStamp[s] = _gen
        _dist[s] = 0
        _parent[s] = -1
        _queue[tail++] = s
    }
    while (head < tail) {
        const c = _queue[head++]
        const d = _dist[c]
        if (d >= maxDist) continue
        const nbs = neighbors4(c)
        for (const nb of nbs) {
            if (world.road[nb] !== 1) continue
            if (_distStamp[nb] === _gen) continue
            _distStamp[nb] = _gen
            _dist[nb] = d + 1
            _parent[nb] = c
            _queue[tail++] = nb
        }
    }
    return { stamp: _gen, distStamp: _distStamp, dist: _dist, parent: _parent, order: _queue, count: tail }
}
