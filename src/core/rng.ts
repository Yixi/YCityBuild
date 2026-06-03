// 确定性伪随机数发生器（mulberry32）。
// 模拟层只允许用它产生随机性，禁用 Math.random()，以保证存档可复现与 golden-test。

export class Rng {
    private state: number

    constructor(seed: number) {
        this.state = seed >>> 0
    }

    // 返回 [0,1)
    next(): number {
        this.state = (this.state + 0x6d2b79f5) >>> 0
        let t = this.state
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    // 返回 [min,max) 的整数
    int(min: number, max: number): number {
        return min + Math.floor(this.next() * (max - min))
    }

    // 以概率 p 返回 true
    chance(p: number): boolean {
        return this.next() < p
    }

    // 用于存档：导出/恢复内部状态
    getState(): number {
        return this.state
    }

    setState(s: number): void {
        this.state = s >>> 0
    }
}
