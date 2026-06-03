import { World } from '@root/core/world'
import { Building, BuildingState, ZoneType } from '@root/core/types'
import { bfsRoad, BfsResult } from '@root/sim/util'
import { roadNeighbor } from '@root/core/roadShape'
import { MAX_PATH } from '@root/core/constants'

// 确保建筑临路格有效
const ensureRoadCell = (world: World, b: Building): number => {
    if (b.roadCell >= 0 && world.road[b.roadCell] === 1) return b.roadCell
    b.roadCell = roadNeighbor(world, b.cell)
    return b.roadCell
}

// 沿 BFS 回溯指针构造 fromRoad→最近源 的路径（含两端），返回 {path, source} 或 null
const tracePath = (res: BfsResult, fromRoad: number): { path: number[], source: number } | null => {
    if (fromRoad < 0 || res.distStamp[fromRoad] !== res.stamp) return null
    let cur = fromRoad
    const path = [cur]
    let guard = 0
    while (res.dist[cur] > 0 && guard++ < MAX_PATH) {
        cur = res.parent[cur]
        path.push(cur)
    }
    return { path, source: cur }
}

// 每日重建分配与行程路径：住宅↔工作/商店、工厂←原料、商店←工厂。
// 注意：bfsRoad 使用共享 scratch，必须「一轮 BFS 完全消费后再下一轮」，故分四趟串行。
export const rebuildRoutes = (world: World): void => {
    world.routes = []
    world.forEachBuilding((b) => {
        if (b.isService) return
        b.workerCount = 0
        b.customerCount = 0
        if (b.zone === ZoneType.R) { b.workplaceId = -1; b.shopId = -1 }
        else b.supplierId = -1
    })

    const jobRoad: Map<number, number> = new Map()
    const jobSources: number[] = []
    const shopRoad: Map<number, number> = new Map()
    const shopSources: number[] = []
    const factoryRoad: Map<number, number> = new Map()
    const factorySources: number[] = []
    const rawSources: number[] = []
    const rawRoad: Map<number, number> = new Map()
    const residents: Building[] = []
    const factories: Building[] = []
    const shops: Building[] = []

    world.forEachBuilding((b) => {
        if (b.isService || b.state !== BuildingState.ACTIVE) return
        const rc = ensureRoadCell(world, b)
        if (rc < 0) return
        if (b.zone === ZoneType.C || b.zone === ZoneType.I || b.zone === ZoneType.RAW) {
            jobRoad.set(rc, b.id); jobSources.push(rc)
        }
        if (b.zone === ZoneType.C) { shopRoad.set(rc, b.id); shopSources.push(rc); shops.push(b) }
        if (b.zone === ZoneType.I) { factoryRoad.set(rc, b.id); factorySources.push(rc); factories.push(b) }
        if (b.zone === ZoneType.RAW) { rawRoad.set(rc, b.id); rawSources.push(rc) }
        if (b.zone === ZoneType.R) residents.push(b)
    })

    // 趟1：住宅 → 最近工作地
    if (jobSources.length > 0) {
        const res = bfsRoad(world, jobSources, MAX_PATH)
        for (const b of residents) {
            const t = tracePath(res, b.roadCell)
            const jobId = t ? jobRoad.get(t.source) : undefined
            if (t && jobId !== undefined) {
                b.workplaceId = jobId
                world.buildings[jobId].workerCount += b.occupancy
                world.routes.push({ path: t.path, volume: b.occupancy, freight: false, homeId: b.id })
            }
        }
    }
    // 趟2：住宅 → 最近商店
    if (shopSources.length > 0) {
        const res = bfsRoad(world, shopSources, MAX_PATH)
        for (const b of residents) {
            const t = tracePath(res, b.roadCell)
            const shopId = t ? shopRoad.get(t.source) : undefined
            if (t && shopId !== undefined) {
                b.shopId = shopId
                world.buildings[shopId].customerCount += b.occupancy
                world.routes.push({ path: t.path, volume: b.occupancy * 0.5, freight: false, homeId: -1 })
            }
        }
    }
    // 趟3：工厂 ← 最近原料业（货运）
    if (rawSources.length > 0) {
        const res = bfsRoad(world, rawSources, MAX_PATH)
        for (const b of factories) {
            const t = tracePath(res, b.roadCell)
            const rawId = t ? rawRoad.get(t.source) : undefined
            if (t && rawId !== undefined) {
                b.supplierId = rawId
                world.routes.push({ path: t.path, volume: b.capacity * 0.4, freight: true, homeId: -1 })
            }
        }
    }
    // 趟4：商店 ← 最近工厂（货运）
    if (factorySources.length > 0) {
        const res = bfsRoad(world, factorySources, MAX_PATH)
        for (const b of shops) {
            const t = tracePath(res, b.roadCell)
            const facId = t ? factoryRoad.get(t.source) : undefined
            if (t && facId !== undefined) {
                b.supplierId = facId
                world.routes.push({ path: t.path, volume: b.capacity * 0.4, freight: true, homeId: -1 })
            }
        }
    }

    world.routesDirty = false
}

// 交通拥堵算完后：用工作路线沿途平均拥堵写回各住宅通勤成本
export const applyCommuteCost = (world: World): void => {
    world.forEachBuilding((b) => {
        if (!b.isService && b.zone === ZoneType.R) b.commuteCost = 0
    })
    for (const r of world.routes) {
        if (r.freight || r.homeId < 0) continue
        const b = world.buildings[r.homeId]
        if (!b) continue
        let sum = 0
        for (const c of r.path) sum += world.traffic[c]
        b.commuteCost = r.path.length > 0 ? Math.min(1, sum / r.path.length) : 0
    }
}
