import { World } from '@root/core/world'
import { TICKS_PER_DAY, DAYS_PER_MONTH, MONTHS_PER_YEAR } from '@root/core/constants'
import { constructionStep, dailyGrowth } from '@root/sim/growth'
import { updateNetworks } from '@root/sim/network'
import { updateServices } from '@root/sim/services'
import { updateTraffic } from '@root/sim/traffic'
import { updateFields } from '@root/sim/fields'
import { updateDemand } from '@root/sim/demand'
import { updateDisasters } from '@root/sim/disasters'
import { updateStats } from '@root/sim/stats'
import { updateProgression } from '@root/sim/progression'
import { settleEconomy } from '@root/sim/economy'

const advanceCalendar = (world: World): void => {
    world.day++
    if (world.day >= DAYS_PER_MONTH) {
        world.day = 0
        world.month++
        world.newMonth = true
        if (world.month >= MONTHS_PER_YEAR) {
            world.month = 0
            world.year++
        }
    }
}

// 推进一个模拟 tick。固定子系统执行顺序（数据依赖拓扑）：
// 网络 → 服务 → 交通 → 场 → 需求 → 生长 → 灾害 → 统计 → 进度 →（月）经济。
export const stepTick = (world: World): void => {
    world.tick++
    world.newDay = false
    world.newMonth = false

    // 每 tick：施工进度
    constructionStep(world)

    if (world.tick % TICKS_PER_DAY === 0) {
        world.newDay = true
        advanceCalendar(world)

        updateNetworks(world)
        updateServices(world)
        updateTraffic(world)
        updateFields(world)
        updateDemand(world)
        dailyGrowth(world)
        updateDisasters(world)
        updateStats(world)
        updateProgression(world)

        if (world.newMonth) settleEconomy(world)
    }
}
