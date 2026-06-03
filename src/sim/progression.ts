import { World } from '@root/core/world'
import { MILESTONES } from '@root/core/constants'

// 进度系统：按人口里程碑解锁建筑/服务/政策，并更新城市等级名称。
export const updateProgression = (world: World): void => {
    for (const m of MILESTONES) {
        if (world.population >= m.pop && !world.unlocks.has(m.unlock)) {
            world.unlocks.add(m.unlock)
            world.milestoneName = m.name
            if (m.pop > 0) world.log(`🏙 城市升级为「${m.name}」，解锁新内容！`)
        }
    }
}
