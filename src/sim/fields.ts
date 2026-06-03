import { World } from '@root/core/world'
import { BuildingState, ServiceType, ZoneType } from '@root/core/types'
import { clamp, neighbors4 } from '@root/sim/util'
import { serviceScoreAt } from '@root/sim/services'
import {
    POLLUTION_DECAY, POLLUTION_INDUSTRY, POLLUTION_POWER_COAL,
    POLLUTION_TRAFFIC, LANDVALUE_BASE,
} from '@root/core/constants'

// 污染：松弛扩散 + 衰减 + 源注入。每游戏日推进一步。
const pollutionStep = (world: World): void => {
    const n = world.n
    const src = world.pollution
    const tmp = new Float32Array(n)

    for (let c = 0; c < n; c++) {
        const nbs = neighbors4(c)
        let sum = 0
        for (const nb of nbs) sum += src[nb]
        const avg = nbs.length > 0 ? sum / nbs.length : 0
        tmp[c] = (src[c] * 0.6 + avg * 0.4) * POLLUTION_DECAY
    }

    // 源注入
    const smokeMul = world.policies.smokeFree ? 0.5 : 1
    const recycleMul = world.policies.recycling ? 0.85 : 1
    world.forEachBuilding((b) => {
        if (b.state !== BuildingState.ACTIVE) return
        if (b.isService) {
            if (b.service === ServiceType.POWER) tmp[b.cell] += POLLUTION_POWER_COAL
            return
        }
        if (b.zone === ZoneType.I) {
            const frac = b.capacity > 0 ? b.occupancy / b.capacity : 0
            tmp[b.cell] += POLLUTION_INDUSTRY * frac * smokeMul * recycleMul
        }
    })
    // 交通污染
    for (let c = 0; c < n; c++) {
        if (world.road[c] === 1) tmp[c] += world.traffic[c] * POLLUTION_TRAFFIC * 16
    }

    for (let c = 0; c < n; c++) {
        world.pollution[c] = clamp(tmp[c], 0, 255)
    }
}

// 地价：基础 + 服务覆盖 - 污染 - 周边拥堵
const landValueStep = (world: World): void => {
    for (let c = 0; c < world.n; c++) {
        const services = serviceScoreAt(world, c)
        let congestion = 0
        for (const nb of neighbors4(c)) {
            if (world.road[nb] === 1 && world.traffic[nb] > congestion) congestion = world.traffic[nb]
        }
        const lv = LANDVALUE_BASE + services * 70 - world.pollution[c] * 0.5 - congestion * 25
        world.landValue[c] = clamp(lv, 0, 255)
    }
}

export const updateFields = (world: World): void => {
    pollutionStep(world)
    landValueStep(world)
}
