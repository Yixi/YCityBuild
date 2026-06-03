import { World } from '@root/core/world'
import { Building } from '@root/core/types'
import { SERVICE_DEFS } from '@root/core/serviceDefs'
import { neighbors4 } from '@root/sim/util'

// 电力 / 水务网络：
// 连通性 = 道路或建筑格在 4-邻接下形成的连通分量（电/水沿路网与相邻建筑传导）。
// 每个连通分量是一本供需账本：只要分量内有供给，分量内建筑即视为接入；
// 供不应求时按建筑 id 顺序确定性限供（容量耗尽后的建筑断供）。

const isConductive = (world: World, c: number): boolean =>
    world.road[c] === 1 || world.buildingId[c] >= 0

export const updateNetworks = (world: World): void => {
    const n = world.n
    const visited = new Uint8Array(n)
    const queue = new Int32Array(n)

    let totalPowerSupply = 0
    let totalPowerDemand = 0
    let totalWaterSupply = 0
    let totalWaterDemand = 0

    let roadCount = 0
    for (let i = 0; i < n; i++) {
        if (world.road[i] === 1) roadCount++
        if (isConductive(world, i)) {
            world.powered[i] = 0
            world.watered[i] = 0
        }
    }
    world.roadCount = roadCount

    for (let start = 0; start < n; start++) {
        if (visited[start] || !isConductive(world, start)) continue
        // BFS 收集连通分量
        let head = 0
        let tail = 0
        visited[start] = 1
        queue[tail++] = start
        const comp: number[] = []
        while (head < tail) {
            const c = queue[head++]
            comp.push(c)
            for (const nb of neighbors4(c)) {
                if (!visited[nb] && isConductive(world, nb)) {
                    visited[nb] = 1
                    queue[tail++] = nb
                }
            }
        }

        // 分量内供给与全部建筑（消费者，含 0 需求的空置楼）
        let powerSupply = 0
        let waterSupply = 0
        const consumers: Building[] = []
        for (const c of comp) {
            const id = world.buildingId[c]
            if (id < 0) continue
            const b = world.buildings[id]
            if (!b) continue
            if (b.isService) {
                powerSupply += SERVICE_DEFS[b.service].powerOutput
                waterSupply += SERVICE_DEFS[b.service].waterOutput
            }
            consumers.push(b)
        }
        totalPowerSupply += powerSupply
        totalWaterSupply += waterSupply

        const poweredNet = powerSupply > 0
        const wateredNet = waterSupply > 0
        consumers.sort((a, b) => a.id - b.id)

        let remP = powerSupply
        let remW = waterSupply
        for (const b of consumers) {
            const pd = world.powerDemandOf(b)
            totalPowerDemand += pd
            if (poweredNet && remP >= pd) {
                remP -= pd
                b.powered = true
                world.powered[b.cell] = 1
            } else {
                b.powered = false
            }
            const wd = world.waterDemandOf(b)
            totalWaterDemand += wd
            if (wateredNet && remW >= wd) {
                remW -= wd
                b.watered = true
                world.watered[b.cell] = 1
            } else {
                b.watered = false
            }
        }

        // 道路通电/通水（用于热力图）：分量内有源即视为可达
        for (const c of comp) {
            if (world.road[c] === 1) {
                if (poweredNet) world.powered[c] = 1
                if (wateredNet) world.watered[c] = 1
            }
        }
    }

    world.powerSupply = Math.round(totalPowerSupply)
    world.powerDemand = Math.round(totalPowerDemand)
    world.waterSupply = Math.round(totalWaterSupply)
    world.waterDemand = Math.round(totalWaterDemand)
    world.networkDirty = false
}
