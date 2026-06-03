import { SIM_DT, MAX_STEPS } from '@root/core/constants'
import { World } from '@root/core/world'

// 固定步长模拟时钟：累积真实时间，按固定 SIM_DT 消费整数步，与渲染帧率解耦。
// speed=0 暂停；1/2/3 倍速只缩放喂入累积器的量，绝不改变 SIM_DT（保证数值稳定与可复现）。
export class SimClock {
    speed = 1
    private acc = 0

    setSpeed(s: number): void {
        this.speed = s
    }

    // realDt：本帧真实经过的秒数。stepFn：推进一个模拟 tick 的函数。
    step(realDt: number, world: World, stepFn: (w: World) => void): void {
        if (this.speed === 0) return
        // 限制单帧真实 dt，避免标签页切回时一次性补太多
        const clamped = Math.min(realDt, 0.25)
        this.acc += clamped * this.speed
        let steps = 0
        while (this.acc >= SIM_DT && steps < MAX_STEPS) {
            this.acc -= SIM_DT
            stepFn(world)
            steps++
        }
        if (steps >= MAX_STEPS) this.acc = 0
    }
}
