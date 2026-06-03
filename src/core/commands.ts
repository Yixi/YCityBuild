import { World } from '@root/core/world'
import { CellKind, ServiceType, ZoneType, BuildingState } from '@root/core/types'
import { SERVICE_DEFS } from '@root/core/serviceDefs'
import { recomputeRoadArea } from '@root/core/roadShape'
import {
    COST_ROAD, COST_ZONE, COST_BULLDOZE, DEBT_LIMIT,
} from '@root/core/constants'

// 所有写操作的唯一入口：校验 → 扣费 → 改网格 → 标脏。返回是否成功。

const affordable = (world: World, cost: number): boolean =>
    world.money - cost >= DEBT_LIMIT

const isClearForBuild = (world: World, cell: number): boolean =>
    world.kind[cell] === CellKind.EMPTY || world.kind[cell] === CellKind.TREE

export const buildRoad = (world: World, cell: number): boolean => {
    if (world.road[cell] === 1) return false
    if (!isClearForBuild(world, cell)) return false
    if (!affordable(world, COST_ROAD)) return false
    world.money -= COST_ROAD
    world.tree[cell] = 0
    world.zone[cell] = ZoneType.NONE
    world.road[cell] = 1
    world.kind[cell] = CellKind.ROAD
    recomputeRoadArea(world, cell)
    world.markRenderArea(cell)
    world.networkDirty = true
    world.routesDirty = true
    world.signalsDirty = true
    return true
}

export const setZone = (world: World, cell: number, zone: ZoneType): boolean => {
    if (!isClearForBuild(world, cell)) return false
    if (world.zone[cell] === zone) return false
    if (!affordable(world, COST_ZONE)) return false
    world.money -= COST_ZONE
    world.tree[cell] = 0
    world.zone[cell] = zone
    world.kind[cell] = CellKind.EMPTY  // 已分区但尚未长出建筑
    world.markRender(cell)
    return true
}

export const placeService = (world: World, cell: number, type: ServiceType): boolean => {
    if (!isClearForBuild(world, cell)) return false
    const def = SERVICE_DEFS[type]
    if (!affordable(world, def.cost)) return false
    world.money -= def.cost
    world.tree[cell] = 0
    world.zone[cell] = ZoneType.NONE
    world.addBuilding(cell, {
        isService: true,
        service: type,
        zone: ZoneType.NONE,
        state: BuildingState.ACTIVE,
        progress: 1,
        capacity: 0,
        occupancy: 0,
    })
    world.log(`建造了${def.label}`)
    return true
}

export const demolish = (world: World, cell: number): boolean => {
    const k = world.kind[cell]
    if (k === CellKind.EMPTY && world.zone[cell] === ZoneType.NONE && world.tree[cell] === 0) {
        return false
    }
    if (!affordable(world, COST_BULLDOZE)) return false
    world.money -= COST_BULLDOZE

    if (world.road[cell] === 1) {
        world.road[cell] = 0
        world.roadShape[cell] = 0
        world.roadRot[cell] = 0
        world.kind[cell] = CellKind.EMPTY
        recomputeRoadArea(world, cell)
        world.networkDirty = true
        world.routesDirty = true
        world.signalsDirty = true
    } else if (k === CellKind.BUILDING || k === CellKind.SERVICE) {
        world.removeBuilding(cell)
    }
    world.tree[cell] = 0
    world.zone[cell] = ZoneType.NONE
    world.kind[cell] = CellKind.EMPTY
    world.markRenderArea(cell)
    return true
}
