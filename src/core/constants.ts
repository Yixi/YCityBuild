// 全局常量与可调参数（数值平衡集中在此，便于后续调优）

// 地图为正方形，边长 MAP_SIZE 格
export const MAP_SIZE = 100

// 模拟时钟：固定步长（与帧率解耦），单位为 1x 速度下的真实秒数
export const SIM_DT = 0.1          // 每个模拟 tick 对应的真实秒数（1x）
export const MAX_STEPS = 8         // 单帧最多消费的 tick 数，防止死亡螺旋

// 游戏内日历
export const TICKS_PER_DAY = 8
export const DAYS_PER_MONTH = 30
export const MONTHS_PER_YEAR = 12

// 经济
export const START_MONEY = 80000
export const COST_ROAD = 25
export const COST_ZONE = 30        // 每格分区刷涂成本
export const COST_BULLDOZE = 8
export const ROAD_MAINTENANCE = 1  // 每段道路每月维护
export const DEBT_LIMIT = -20000   // 低于此值进入严重赤字（限制建造）

// 建筑容量（满级时单格容纳的人口/岗位）
export const CAP_RESIDENTIAL = 18  // 住宅单格居民
export const CAP_COMMERCIAL = 12   // 商业单格岗位
export const CAP_INDUSTRIAL = 16   // 工业单格岗位
export const MAX_LEVEL = 3

// 建造速度
export const CONSTRUCTION_PER_TICK = 0.12   // 每 tick 建造进度增量
export const OCCUPANCY_PER_DAY = 0.18       // 每日入住率变化
export const GROW_BUDGET_PER_DAY = 14       // 每日每类分区最多新生长格数

// 公用事业：单格需求（满级满员时）
export const POWER_PER_RESIDENT = 0.25
export const POWER_PER_JOB = 0.35
export const WATER_PER_RESIDENT = 0.2
export const WATER_PER_JOB = 0.22

// 税率（默认）
export const TAX_RESIDENTIAL = 0.11
export const TAX_COMMERCIAL = 0.12
export const TAX_INDUSTRIAL = 0.10
// 单位人口/岗位每月产生的应税产值基数
export const VALUE_PER_RESIDENT = 12
export const VALUE_PER_JOB = 14

// 场（污染/地价）参数
export const POLLUTION_DECAY = 0.86
export const POLLUTION_INDUSTRY = 40
export const POLLUTION_POWER_COAL = 60
export const POLLUTION_TRAFFIC = 0.5
export const LANDVALUE_BASE = 30

// 交通
export const ROAD_CAPACITY = 24        // 单段道路容量
export const TRIPS_PER_RESIDENT = 1.0
export const MAX_PATH = 80             // 交通分配单条路径最大长度

// 服务覆盖默认半径（沿路 BFS 步数）与每月维护
export interface ServiceDef {
    radius: number
    upkeep: number
    cost: number
    power: number       // 自身耗电（服务建筑）
    water: number
    powerOutput: number // 发电量（电厂）
    waterOutput: number // 供水量（水厂）
    label: string
    color: [number, number, number]
}

// 人口里程碑解锁（人口阈值 → 解锁项）
export const MILESTONES: Array<{ pop: number, unlock: string, name: string }> = [
    { pop: 0, unlock: 'basics', name: '小村落' },
    { pop: 200, unlock: 'services', name: '村庄' },
    { pop: 800, unlock: 'health_edu', name: '小镇' },
    { pop: 2500, unlock: 'highdensity', name: '城市' },
    { pop: 8000, unlock: 'transit', name: '大都会' },
]
