import { World } from '@root/core/world'
import { ServiceType } from '@root/core/types'
import { ROAD_CAPACITY, FREIGHT_VOLUME } from '@root/core/constants'

// 交通：把通勤/货运行程路径（logistics 生成的 world.routes）的流量压到沿途路段，
// 归一化为拥堵度 0..1，并按公交覆盖 / 免费公交政策削减。每游戏日重算一次。
export const updateTraffic = (world: World): void => {
    world.traffic.fill(0)

    for (const r of world.routes) {
        const vol = r.freight ? r.volume * (1 + FREIGHT_VOLUME) : r.volume
        for (const cell of r.path) world.traffic[cell] += vol
    }

    const transit = world.coverage[ServiceType.TRANSIT]
    const transitPolicy = world.policies.freeTransit ? 0.8 : 1
    for (let i = 0; i < world.n; i++) {
        if (world.road[i] !== 1) continue
        let load = world.traffic[i] / ROAD_CAPACITY
        load *= (1 - transit[i] * 0.5) * transitPolicy
        world.traffic[i] = load > 1 ? 1 : load
    }
}
