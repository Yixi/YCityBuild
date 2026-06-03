import {
    MAP_SIZE, START_MONEY, CAP_RESIDENTIAL, CAP_COMMERCIAL, CAP_INDUSTRIAL,
    TAX_RESIDENTIAL, TAX_COMMERCIAL, TAX_INDUSTRIAL,
    POWER_PER_RESIDENT, POWER_PER_JOB, WATER_PER_RESIDENT, WATER_PER_JOB,
} from '@root/core/constants'
import {
    Building, BuildingState, CellKind, ServiceType, ZoneType,
} from '@root/core/types'
import { SERVICE_DEFS, COVERAGE_SERVICES } from '@root/core/serviceDefs'
import { idx, inBounds } from '@root/core/grid'
import { Rng } from '@root/core/rng'

// 全局世界状态：逻辑层的唯一真源。纯数据 + 少量数据维护方法，不持有任何 Babylon mesh。
export class World {
    size = MAP_SIZE
    n = MAP_SIZE * MAP_SIZE

    // —— 网格平行 typed-array 层 ——
    kind: Uint8Array            // CellKind
    zone: Uint8Array            // ZoneType
    road: Uint8Array            // 0/1
    roadShape: Uint8Array       // RoadShape
    roadRot: Float32Array       // 弧度
    tree: Uint8Array            // 0/1
    buildingId: Int32Array      // -1 表示无建筑
    // 场
    pollution: Float32Array
    landValue: Float32Array
    traffic: Float32Array       // 拥堵度 0..1
    powered: Uint8Array         // 0/1（建筑与道路是否通电）
    watered: Uint8Array         // 0/1
    coverage: Record<number, Float32Array> = {}   // 各覆盖型服务的覆盖场 0..1

    // —— 建筑富信息 ——
    buildings: Array<Building | null> = []
    private freeIds: number[] = []
    serviceCells: Set<number> = new Set()   // 设施建筑 id 集合

    // —— 日历 ——
    tick = 0
    day = 0
    month = 0
    year = 1
    newDay = false
    newMonth = false

    // —— 经济 ——
    money = START_MONEY
    lastIncome = 0
    lastExpense = 0
    taxRates = { r: TAX_RESIDENTIAL, c: TAX_COMMERCIAL, i: TAX_INDUSTRIAL }

    // —— RCI 需求（-1..1）——
    demand = { r: 0.7, c: 0.2, i: 0.4 }

    // —— 统计聚合 ——
    population = 0
    jobs = 0              // 已填补岗位（商业+工业在岗）
    employed = 0
    residentialCap = 0
    commercialCap = 0
    industrialCap = 0
    happiness = 0.6

    // 公用事业供需聚合
    powerSupply = 0
    powerDemand = 0
    waterSupply = 0
    waterDemand = 0

    // 政策旋钮
    policies: Record<string, boolean> = {
        recycling: false,
        smokeFree: false,
        freeTransit: false,
        highTax: false,
    }

    // 进度解锁
    unlocks: Set<string> = new Set(['basics'])
    milestoneName = '小村落'

    rng: Rng

    // —— 脏标记 / 选择 / 消息 ——
    renderDirty: Set<number> = new Set()
    networkDirty = true
    selection = -1
    messages: string[] = []

    constructor(seed = 12345) {
        this.rng = new Rng(seed)
        this.kind = new Uint8Array(this.n)
        this.zone = new Uint8Array(this.n)
        this.road = new Uint8Array(this.n)
        this.roadShape = new Uint8Array(this.n)
        this.roadRot = new Float32Array(this.n)
        this.tree = new Uint8Array(this.n)
        this.buildingId = new Int32Array(this.n).fill(-1)
        this.pollution = new Float32Array(this.n)
        this.landValue = new Float32Array(this.n)
        this.traffic = new Float32Array(this.n)
        this.powered = new Uint8Array(this.n)
        this.watered = new Uint8Array(this.n)
        for (const s of COVERAGE_SERVICES) {
            this.coverage[s] = new Float32Array(this.n)
        }
    }

    markRender(cell: number): void {
        this.renderDirty.add(cell)
    }

    markRenderArea(cell: number): void {
        // 标记 3x3 邻域（道路外观会受邻居影响）
        const x = Math.floor(cell / this.size)
        const z = cell % this.size
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (inBounds(x + dx, z + dz)) this.markRender(idx(x + dx, z + dz))
            }
        }
    }

    log(msg: string): void {
        this.messages.unshift(msg)
        if (this.messages.length > 30) this.messages.pop()
    }

    getBuilding(cell: number): Building | null {
        const id = this.buildingId[cell]
        return id < 0 ? null : this.buildings[id]
    }

    // 新建一个建筑（生长楼房或设施），登记到网格并返回对象
    addBuilding(cell: number, params: Partial<Building>): Building {
        const x = Math.floor(cell / this.size)
        const z = cell % this.size
        const id = this.freeIds.length ? this.freeIds.pop() : this.buildings.length
        const b: Building = {
            id, cell, x, z,
            zone: ZoneType.NONE,
            isService: false,
            service: ServiceType.POWER,
            level: 1,
            progress: 0,
            state: BuildingState.CONSTRUCTING,
            capacity: 0,
            occupancy: 0,
            roadCell: -1,
            powered: false,
            watered: false,
            unhealthyDays: 0,
            fireDays: 0,
            happiness: 0.5,
            ...params,
        }
        this.buildings[id] = b
        this.buildingId[cell] = id
        this.kind[cell] = b.isService ? CellKind.SERVICE : CellKind.BUILDING
        if (b.isService) this.serviceCells.add(id)
        this.networkDirty = true
        this.markRenderArea(cell)
        return b
    }

    removeBuilding(cell: number): void {
        const id = this.buildingId[cell]
        if (id < 0) return
        this.buildings[id] = null
        this.freeIds.push(id)
        this.serviceCells.delete(id)
        this.buildingId[cell] = -1
        this.kind[cell] = this.zone[cell] !== ZoneType.NONE ? CellKind.EMPTY : CellKind.EMPTY
        this.powered[cell] = 0
        this.watered[cell] = 0
        this.networkDirty = true
        this.markRenderArea(cell)
    }

    // 计算单格满级容量（按分区类型）
    capacityFor(zone: ZoneType, level: number): number {
        const base = zone === ZoneType.R ? CAP_RESIDENTIAL
            : zone === ZoneType.C ? CAP_COMMERCIAL
                : CAP_INDUSTRIAL
        return base * level
    }

    // 单个建筑当前的电力需求
    powerDemandOf(b: Building): number {
        if (b.isService) return SERVICE_DEFS[b.service].power
        if (b.zone === ZoneType.R) return b.occupancy * POWER_PER_RESIDENT
        return b.occupancy * POWER_PER_JOB
    }

    waterDemandOf(b: Building): number {
        if (b.isService) return SERVICE_DEFS[b.service].water
        if (b.zone === ZoneType.R) return b.occupancy * WATER_PER_RESIDENT
        return b.occupancy * WATER_PER_JOB
    }

    // 遍历所有存活建筑
    forEachBuilding(fn: (b: Building) => void): void {
        for (let i = 0; i < this.buildings.length; i++) {
            const b = this.buildings[i]
            if (b) fn(b)
        }
    }
}
