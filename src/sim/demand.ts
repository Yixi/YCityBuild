import { World } from '@root/core/world'
import { clamp } from '@root/sim/util'

// RCI + 原料 需求：根据就业-居住平衡、税率、容量过剩与产业链供给推导各类需求（-1..1），驱动分区生长。
export const updateDemand = (world: World): void => {
    const pop = world.population
    const S = Math.max(150, pop)
    const jobCap = world.commercialCap + world.industrialCap + world.rawCap
    const workforce = pop * 0.62

    // 住宅：岗位多于居民→吸引人口；空房过多→抑制；税高→抑制
    const rDemand = clamp(
        0.35
        + (jobCap - pop) / S * 1.1
        - Math.max(0, world.residentialCap - pop) / S * 0.7
        - (world.taxRates.r - 0.10) * 4,
        -1, 1)

    // 商业：人口（顾客）多而商业容量不足→需求；税高→抑制
    const cDemand = clamp(
        0.15
        + (pop - world.commercialCap * 1.6) / S
        - (world.taxRates.c - 0.10) * 4,
        -1, 1)

    // 工业：外部基础需求 + 劳动力供给；工业过剩→抑制；税高→抑制
    const iDemand = clamp(
        0.45
        + (workforce * 0.5 - world.industrialCap) / S
        - (world.taxRates.i - 0.10) * 4,
        -1, 1)

    // 原料：工厂越多越需要原料供给；原料过剩→抑制
    const rawDemand = clamp(
        0.3
        + (world.industrialCap * 0.6 - world.rawCap) / S,
        -1, 1)

    // 平滑过渡，避免抖动
    world.demand.r += (rDemand - world.demand.r) * 0.4
    world.demand.c += (cDemand - world.demand.c) * 0.4
    world.demand.i += (iDemand - world.demand.i) * 0.4
    world.demand.raw += (rawDemand - world.demand.raw) * 0.4
}
