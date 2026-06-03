import { World } from '@root/core/world'
import { BuildingState, ZoneType } from '@root/core/types'
import { roadNeighbor } from '@root/core/roadShape'
import { clamp } from '@root/sim/util'
import { serviceScoreAt } from '@root/sim/services'
import {
    CONSTRUCTION_PER_TICK, OCCUPANCY_PER_DAY, GROW_BUDGET_PER_DAY, MAX_LEVEL,
    COMMUTE_HAPPY_PENALTY, COMMUTE_GROWTH_PENALTY, NO_JOB_PENALTY,
} from '@root/core/constants'

// 每 tick：推进在建建筑的施工进度，完工转为 ACTIVE。
export const constructionStep = (world: World): void => {
    world.forEachBuilding((b) => {
        if (b.isService || b.state !== BuildingState.CONSTRUCTING) return
        b.progress += CONSTRUCTION_PER_TICK
        if (b.progress >= 1) {
            b.progress = 1
            b.state = BuildingState.ACTIVE
            b.capacity = world.capacityFor(b.zone, b.level)
            world.markRenderArea(b.cell)
        }
    })
}

const demandForZone = (world: World, zone: ZoneType): number =>
    zone === ZoneType.R ? world.demand.r
        : zone === ZoneType.C ? world.demand.c
            : zone === ZoneType.I ? world.demand.i
                : world.demand.raw

export const dailyGrowth = (world: World): void => {
    updateActive(world)
    spawnNew(world)
}

const updateActive = (world: World): void => {
    const toAbandon: number[] = []
    world.forEachBuilding((b) => {
        if (b.isService || b.state !== BuildingState.ACTIVE) return
        if (b.roadCell < 0 || world.road[b.roadCell] !== 1) b.roadCell = roadNeighbor(world, b.cell)

        const dem = demandForZone(world, b.zone)
        const roadAccess = b.roadCell >= 0
        const pollutionOk = b.zone !== ZoneType.R || world.pollution[b.cell] < 130
        // 健康只取决于「路/电/水/需求」（硬条件）；通勤与供应链是软修正，不卡死生长
        const healthy = roadAccess && b.powered && b.watered && dem > -0.3 && pollutionOk
        const services = serviceScoreAt(world, b.cell)

        let target: number
        if (healthy) {
            target = clamp(0.42 + services * 0.6 - world.pollution[b.cell] / 400, 0, 1)
            if (b.zone === ZoneType.R) {
                target -= b.commuteCost * COMMUTE_HAPPY_PENALTY
                if (b.workplaceId < 0) target -= NO_JOB_PENALTY
            } else if (b.zone === ZoneType.C) {
                target -= b.shortage * 0.3   // 缺货降满意
            } else if (b.zone === ZoneType.I) {
                target -= b.shortage * 0.2   // 缺原料降满意
            }
            target = clamp(target, 0, 1)
        } else {
            target = 0.12
        }
        b.happiness += (target - b.happiness) * 0.3

        if (healthy) {
            b.unhealthyDays = 0
            let rate = OCCUPANCY_PER_DAY
            if (b.zone === ZoneType.R) rate *= (1 - b.commuteCost * COMMUTE_GROWTH_PENALTY)
            b.occupancy = Math.min(b.capacity, b.occupancy + rate * Math.max(1, b.capacity))
            const canLevel3 = b.level < 2 || world.unlocks.has('highdensity')
            if (b.level < MAX_LEVEL && canLevel3
                && world.landValue[b.cell] > b.level * 55
                && dem > 0.3 && b.occupancy > b.capacity * 0.8) {
                b.level++
                b.capacity = world.capacityFor(b.zone, b.level)
                world.markRenderArea(b.cell)
            }
        } else {
            b.unhealthyDays++
            b.occupancy = Math.max(0, b.occupancy - OCCUPANCY_PER_DAY * b.capacity)
            const fatal = !roadAccess || !b.powered || !b.watered
            if (fatal && b.unhealthyDays > 8 && b.occupancy <= 0.5) toAbandon.push(b.cell)
        }
    })
    for (const cell of toAbandon) world.removeBuilding(cell)
}

const spawnNew = (world: World): void => {
    const buckets: Record<number, number[]> = {
        [ZoneType.R]: [], [ZoneType.C]: [], [ZoneType.I]: [], [ZoneType.RAW]: [],
    }

    for (let c = 0; c < world.n; c++) {
        const z = world.zone[c]
        if (z === ZoneType.NONE) continue
        if (world.buildingId[c] >= 0 || world.road[c] === 1) continue
        const rc = roadNeighbor(world, c)
        if (rc < 0 || world.powered[rc] !== 1) continue
        buckets[z].push(c)
    }

    for (const z of [ZoneType.R, ZoneType.C, ZoneType.I, ZoneType.RAW]) {
        const dem = demandForZone(world, z)
        if (dem <= 0.05) continue
        const list = buckets[z]
        if (list.length === 0) continue
        const budget = Math.min(list.length, Math.ceil(dem * GROW_BUDGET_PER_DAY))
        for (let k = 0; k < budget; k++) {
            const j = k + world.rng.int(0, list.length - k)
            const tmp = list[k]
            list[k] = list[j]
            list[j] = tmp
            const cell = list[k]
            const rc = roadNeighbor(world, cell)
            world.addBuilding(cell, {
                zone: z,
                state: BuildingState.CONSTRUCTING,
                progress: 0,
                level: 1,
                capacity: 0,
                roadCell: rc,
            })
        }
    }
}
