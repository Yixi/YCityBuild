import { World } from '@root/core/world'
import { Building } from '@root/core/types'
import { updateNetworks } from '@root/sim/network'
import { updateStats } from '@root/sim/stats'

const KEY = 'ycity-save'

// 只序列化「源真相」（拓扑 + 经营态 + RNG 种子），派生场（污染/地价/覆盖）读档后由模拟重算。
export const saveWorld = (world: World): boolean => {
    try {
        const data = {
            tick: world.tick, day: world.day, month: world.month, year: world.year,
            money: world.money, lastIncome: world.lastIncome, lastExpense: world.lastExpense,
            taxRates: world.taxRates, demand: world.demand, policies: world.policies,
            unlocks: Array.from(world.unlocks), milestoneName: world.milestoneName,
            rngState: world.rng.getState(),
            kind: Array.from(world.kind),
            zone: Array.from(world.zone),
            road: Array.from(world.road),
            roadShape: Array.from(world.roadShape),
            roadRot: Array.from(world.roadRot),
            tree: Array.from(world.tree),
            buildingId: Array.from(world.buildingId),
            buildings: world.buildings,
        }
        localStorage.setItem(KEY, JSON.stringify(data))
        world.log('💾 已存档')
        return true
    } catch {
        world.log('存档失败')
        return false
    }
}

export const hasSave = (): boolean => localStorage.getItem(KEY) !== null

export const loadWorld = (world: World): boolean => {
    const raw = localStorage.getItem(KEY)
    if (!raw) return false
    try {
        const d = JSON.parse(raw)
        world.tick = d.tick; world.day = d.day; world.month = d.month; world.year = d.year
        world.money = d.money; world.lastIncome = d.lastIncome; world.lastExpense = d.lastExpense
        world.taxRates = d.taxRates; world.demand = d.demand; world.policies = d.policies
        world.unlocks = new Set(d.unlocks); world.milestoneName = d.milestoneName
        world.rng.setState(d.rngState)

        world.kind.set(d.kind)
        world.zone.set(d.zone)
        world.road.set(d.road)
        world.roadShape.set(d.roadShape)
        world.roadRot.set(d.roadRot)
        world.tree.set(d.tree)
        world.buildingId.set(d.buildingId)

        // 还原建筑数组 + 空位表 + 设施集合
        world.buildings = (d.buildings as Array<Building | null>).map((b) => b ? { ...b } : null)
        world.serviceCells = new Set()
        for (let i = 0; i < world.buildings.length; i++) {
            const b = world.buildings[i]
            if (b && b.isService) world.serviceCells.add(b.id)
        }

        // 立即重算网络与统计，使读档后状态正确
        world.networkDirty = true
        updateNetworks(world)
        updateStats(world)
        world.log('📂 已读档')
        return true
    } catch {
        world.log('读档失败')
        return false
    }
}
