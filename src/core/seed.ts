import { World } from '@root/core/world'
import { CellKind, ServiceType, ZoneType, BuildingState } from '@root/core/types'
import { idx } from '@root/core/grid'
import { recomputeRoad } from '@root/core/roadShape'
import { updateNetworks } from '@root/sim/network'
import { updateStats } from '@root/sim/stats'

// 初始城镇：一小片路网 + R/C/I 分区 + 一座电厂一座水厂 + 散布树木，让游戏开局即「活」。
export const seedWorld = (world: World): void => {
    const roadCells: number[] = []
    // 外环
    for (let x = 45; x <= 55; x++) { roadCells.push(idx(x, 47)); roadCells.push(idx(x, 53)) }
    for (let z = 47; z <= 53; z++) { roadCells.push(idx(45, z)); roadCells.push(idx(55, z)) }
    // 中心十字
    for (let x = 45; x <= 55; x++) roadCells.push(idx(x, 50))
    for (let z = 47; z <= 53; z++) roadCells.push(idx(50, z))

    for (const c of roadCells) {
        world.road[c] = 1
        world.kind[c] = CellKind.ROAD
    }
    for (const c of roadCells) recomputeRoad(world, c)

    // 环内非道路格刷分区
    for (let x = 45; x <= 55; x++) {
        for (let z = 47; z <= 53; z++) {
            const c = idx(x, z)
            if (world.road[c] === 1) continue
            const zt = x < 50 ? ZoneType.R : (z < 50 ? ZoneType.C : ZoneType.I)
            world.zone[c] = zt
            world.kind[c] = CellKind.EMPTY
        }
    }

    // 公用事业（开局免费配置）
    const plant = (cell: number, type: ServiceType): void => {
        world.addBuilding(cell, {
            isService: true, service: type, state: BuildingState.ACTIVE, progress: 1,
        })
    }
    plant(idx(44, 50), ServiceType.POWER)
    plant(idx(56, 50), ServiceType.WATER)

    // 散布树木
    for (let i = 0; i < 220; i++) {
        const x = world.rng.int(5, 95)
        const z = world.rng.int(5, 95)
        const c = idx(x, z)
        if (world.kind[c] === CellKind.EMPTY && world.zone[c] === ZoneType.NONE
            && world.road[c] !== 1 && world.buildingId[c] < 0) {
            world.tree[c] = 1
            world.kind[c] = CellKind.TREE
        }
    }

    updateNetworks(world)
    updateStats(world)
    world.log('欢迎来到你的城市！修路、分区，让它成长起来。')
}
