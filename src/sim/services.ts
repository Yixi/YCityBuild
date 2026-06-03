import { World } from '@root/core/world'
import { BuildingState, ServiceType } from '@root/core/types'
import { SERVICE_DEFS, COVERAGE_SERVICES } from '@root/core/serviceDefs'
import { roadNeighbor } from '@root/core/roadShape'
import { bfsRoad, neighbors4 } from '@root/sim/util'

// 覆盖型服务：从设施沿道路 BFS 扩散，距离越远强度越低。覆盖落到道路格及其相邻建筑格。
export const updateServices = (world: World): void => {
    // 重置覆盖场
    for (const s of COVERAGE_SERVICES) {
        world.coverage[s].fill(0)
    }

    world.serviceCells.forEach((id) => {
        const b = world.buildings[id]
        if (!b || b.state !== BuildingState.ACTIVE) return
        if (COVERAGE_SERVICES.indexOf(b.service) < 0) return
        const def = SERVICE_DEFS[b.service]
        const field = world.coverage[b.service]

        // 自身格满覆盖
        field[b.cell] = Math.max(field[b.cell], 1)

        const start = roadNeighbor(world, b.cell)
        if (start < 0) {
            // 不临路：仅覆盖相邻建筑
            for (const nb of neighbors4(b.cell)) {
                field[nb] = Math.max(field[nb], 0.5)
            }
            return
        }

        const res = bfsRoad(world, [start], def.radius)
        for (let k = 0; k < res.count; k++) {
            const c = res.order[k]
            const strength = 1 - res.dist[c] / def.radius
            if (strength <= 0) continue
            if (strength > field[c]) field[c] = strength
            // 覆盖相邻建筑格
            for (const nb of neighbors4(c)) {
                if (world.buildingId[nb] >= 0 && strength > field[nb]) field[nb] = strength
            }
        }
    })
}

// 取某格综合民生服务评分（用于地价与幸福度），加权求和（关键服务权重更高），上限 1.2。
// 注意：用加权而非「除以服务种类数」，否则单座设施被稀释到几乎无效。
export const serviceScoreAt = (world: World, cell: number): number => {
    const s =
        world.coverage[ServiceType.PARK][cell] * 0.5
        + world.coverage[ServiceType.HEALTH][cell] * 0.35
        + world.coverage[ServiceType.EDUCATION][cell] * 0.3
        + world.coverage[ServiceType.POLICE][cell] * 0.25
        + world.coverage[ServiceType.TRANSIT][cell] * 0.25
        + world.coverage[ServiceType.FIRE][cell] * 0.2
        + world.coverage[ServiceType.GARBAGE][cell] * 0.2
    return s > 1.2 ? 1.2 : s
}
