import { World } from '@root/core/world'
import { BuildingState, ZoneType } from '@root/core/types'

// 聚合统计：人口、岗位、各类容量、平均幸福度。供 HUD 与 RCI 需求系统读取。
export const updateStats = (world: World): void => {
    let pop = 0
    let jobsFilled = 0
    let rCap = 0
    let cCap = 0
    let iCap = 0
    let rawCap = 0
    let happSum = 0
    let count = 0

    world.forEachBuilding((b) => {
        if (b.isService || b.state !== BuildingState.ACTIVE) return
        if (b.zone === ZoneType.R) {
            pop += b.occupancy
            rCap += b.capacity
        } else if (b.zone === ZoneType.C) {
            jobsFilled += b.occupancy
            cCap += b.capacity
        } else if (b.zone === ZoneType.I) {
            jobsFilled += b.occupancy
            iCap += b.capacity
        } else if (b.zone === ZoneType.RAW) {
            jobsFilled += b.occupancy
            rawCap += b.capacity
        }
        happSum += b.happiness
        count++
    })

    world.population = Math.round(pop)
    world.jobs = Math.round(jobsFilled)
    world.residentialCap = rCap
    world.commercialCap = cCap
    world.industrialCap = iCap
    world.rawCap = rawCap
    world.employed = Math.min(pop * 0.62, jobsFilled)
    world.happiness = count > 0 ? happSum / count : 0.6
}
