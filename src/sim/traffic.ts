import { World } from '@root/core/world'
import { BuildingState, ServiceType, ZoneType } from '@root/core/types'
import { roadNeighbor } from '@root/core/roadShape'
import { bfsRoad } from '@root/sim/util'
import { ROAD_CAPACITY, TRIPS_PER_RESIDENT, MAX_PATH } from '@root/core/constants'

// 交通：把居民区→就业区的通勤用「最近吸引点 + 路径分配」近似，避免逐车 A*。
// 1) 以所有商业/工业临路格为源做一次多源 BFS，得到每个道路格指向最近就业点的回溯指针；
// 2) 每个住宅区沿回溯指针把通勤量压到沿途路段；
// 3) 路段负载/容量 → 拥堵度，受公交枢纽覆盖削减。每游戏日重算一次。

// 确保建筑的临路格仍有效，必要时重算
const ensureRoadCell = (world: World, cell: number, current: number): number => {
    if (current >= 0 && world.road[current] === 1) return current
    return roadNeighbor(world, cell)
}

export const updateTraffic = (world: World): void => {
    world.traffic.fill(0)

    const attractors: number[] = []
    interface Src { road: number, load: number }
    const sources: Src[] = []

    world.forEachBuilding((b) => {
        if (b.isService || b.state !== BuildingState.ACTIVE) return
        b.roadCell = ensureRoadCell(world, b.cell, b.roadCell)
        if (b.roadCell < 0) return
        if (b.zone === ZoneType.C || b.zone === ZoneType.I) {
            attractors.push(b.roadCell)
        } else if (b.zone === ZoneType.R) {
            sources.push({ road: b.roadCell, load: Math.max(1, b.occupancy * TRIPS_PER_RESIDENT * 0.2) })
        }
    })

    if (attractors.length === 0 || sources.length === 0) return

    const res = bfsRoad(world, attractors, MAX_PATH)

    for (const s of sources) {
        if (res.distStamp[s.road] !== res.stamp) continue  // 无法连通到就业点
        let cur = s.road
        let steps = 0
        while (cur >= 0 && res.distStamp[cur] === res.stamp && steps < MAX_PATH) {
            world.traffic[cur] += s.load
            if (res.dist[cur] === 0) break  // 到达就业点
            cur = res.parent[cur]
            steps++
        }
    }

    // 归一化为拥堵度 0..1，并按公交覆盖 / 免费公交政策削减
    const transit = world.coverage[ServiceType.TRANSIT]
    const transitPolicy = world.policies.freeTransit ? 0.8 : 1
    for (let i = 0; i < world.n; i++) {
        if (world.road[i] !== 1) continue
        let load = world.traffic[i] / ROAD_CAPACITY
        load *= (1 - transit[i] * 0.5) * transitPolicy
        world.traffic[i] = load > 1 ? 1 : load
    }
}

// 某建筑临路格的拥堵度（用于地价/商业惩罚）
export const congestionAt = (world: World, roadCell: number): number =>
    roadCell >= 0 ? world.traffic[roadCell] : 0
