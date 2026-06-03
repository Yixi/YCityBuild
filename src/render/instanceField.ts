import * as BABYLON from 'babylonjs'

// 单个原型的薄实例池：按格子 idx 增删改实例矩阵，每个池 = 1 draw call。
// 删除用 swap-with-last 保持紧凑；count 控制可见实例数。
export class InstanceField {
    private capacity: number
    private buffer: Float32Array
    private count = 0
    private cellToSlot: Map<number, number> = new Map()
    private slotToCell: Int32Array
    private dirty = false

    constructor(private mesh: BABYLON.Mesh, capacity = 64) {
        this.capacity = capacity
        this.buffer = new Float32Array(capacity * 16)
        this.slotToCell = new Int32Array(capacity).fill(-1)
        this.mesh.thinInstanceSetBuffer('matrix', this.buffer, 16, false)
        this.mesh.thinInstanceCount = 0
    }

    private grow(): void {
        const newCap = this.capacity * 2
        const newBuf = new Float32Array(newCap * 16)
        newBuf.set(this.buffer)
        const newSlot = new Int32Array(newCap).fill(-1)
        newSlot.set(this.slotToCell)
        this.capacity = newCap
        this.buffer = newBuf
        this.slotToCell = newSlot
        this.mesh.thinInstanceSetBuffer('matrix', this.buffer, 16, false)
    }

    has(cell: number): boolean {
        return this.cellToSlot.has(cell)
    }

    // 新增或更新某格的实例矩阵
    set(cell: number, matrix: BABYLON.Matrix): void {
        let slot = this.cellToSlot.get(cell)
        if (slot === undefined) {
            if (this.count >= this.capacity) this.grow()
            slot = this.count++
            this.cellToSlot.set(cell, slot)
            this.slotToCell[slot] = cell
        }
        matrix.copyToArray(this.buffer, slot * 16)
        this.dirty = true
    }

    remove(cell: number): void {
        const slot = this.cellToSlot.get(cell)
        if (slot === undefined) return
        const last = --this.count
        if (slot !== last) {
            // 把最后一个实例移动到被删槽位
            this.buffer.copyWithin(slot * 16, last * 16, last * 16 + 16)
            const lastCell = this.slotToCell[last]
            this.slotToCell[slot] = lastCell
            this.cellToSlot.set(lastCell, slot)
        }
        this.slotToCell[last] = -1
        this.cellToSlot.delete(cell)
        this.dirty = true
    }

    // 提交本帧改动到 GPU
    flush(): void {
        if (!this.dirty) return
        this.mesh.thinInstanceCount = this.count
        this.mesh.thinInstanceBufferUpdated('matrix')
        this.mesh.setEnabled(this.count > 0)
        this.dirty = false
    }
}
