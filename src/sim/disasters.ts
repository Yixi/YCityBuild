import { World } from '@root/core/world'
import { BuildingState, ServiceType, ZoneType } from '@root/core/types'
import { neighbors4 } from '@root/sim/util'

// 火灾：消防覆盖不足的活跃建筑有概率起火；着火后若覆盖足够则扑灭，否则数日后烧毁并可能蔓延。
export const updateDisasters = (world: World): void => {
    const fire = world.coverage[ServiceType.FIRE]
    const destroyList: number[] = []

    world.forEachBuilding((b) => {
        if (b.isService) return
        if (b.state === BuildingState.ACTIVE) {
            const cover = fire[b.cell]
            const risk = 0.0008 * (1 - cover) * (b.zone === ZoneType.I ? 2 : 1)
            if (world.rng.chance(risk)) {
                b.state = BuildingState.ONFIRE
                b.fireDays = 0
                world.markRenderArea(b.cell)
                world.log('🔥 发生火灾！')
            }
        } else if (b.state === BuildingState.ONFIRE) {
            b.fireDays++
            const cover = fire[b.cell]
            if (cover > 0.3 && world.rng.chance(0.4 + cover * 0.4)) {
                b.state = BuildingState.ACTIVE
                b.occupancy *= 0.5
                world.markRenderArea(b.cell)
            } else if (b.fireDays >= 3) {
                destroyList.push(b.cell)
                for (const nb of neighbors4(b.cell)) {
                    const nbB = world.getBuilding(nb)
                    if (nbB && !nbB.isService && nbB.state === BuildingState.ACTIVE && world.rng.chance(0.3)) {
                        nbB.state = BuildingState.ONFIRE
                        nbB.fireDays = 0
                        world.markRenderArea(nb)
                    }
                }
            }
        }
    })

    for (const cell of destroyList) {
        world.removeBuilding(cell)
        world.log('🔥 一栋建筑被烧毁')
    }
}
