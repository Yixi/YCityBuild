import { World } from '@root/core/world'
import { BuildingState, ZoneType } from '@root/core/types'
import { SERVICE_DEFS } from '@root/core/serviceDefs'
import {
    ROAD_MAINTENANCE, VALUE_PER_RESIDENT, VALUE_PER_JOB, DEBT_LIMIT,
} from '@root/core/constants'

// 月度经济结算：税收入账、维护支出，更新资金。
export const settleEconomy = (world: World): void => {
    const taxMul = world.policies.highTax ? 1.25 : 1
    let income = 0
    let expense = 0

    world.forEachBuilding((b) => {
        if (b.isService) {
            expense += SERVICE_DEFS[b.service].upkeep
            return
        }
        if (b.state !== BuildingState.ACTIVE) return
        const perUnit = b.zone === ZoneType.R ? VALUE_PER_RESIDENT : VALUE_PER_JOB
        const rate = b.zone === ZoneType.R ? world.taxRates.r
            : b.zone === ZoneType.C ? world.taxRates.c
                : world.taxRates.i
        // 税收随入住与幸福度浮动
        income += b.occupancy * perUnit * rate * taxMul * (0.5 + 0.5 * b.happiness)
    })

    // 道路维护
    let roadCount = 0
    for (let i = 0; i < world.n; i++) {
        if (world.road[i] === 1) roadCount++
    }
    expense += roadCount * ROAD_MAINTENANCE

    income = Math.round(income)
    expense = Math.round(expense)
    world.lastIncome = income
    world.lastExpense = expense
    world.money += income - expense

    if (world.money < DEBT_LIMIT) {
        world.log('⚠ 资金严重不足，已限制建造！')
    } else if (world.money < 0) {
        world.log('⚠ 城市出现赤字')
    }
}
