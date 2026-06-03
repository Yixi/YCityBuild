import { ServiceType } from '@root/core/types'
import { ServiceDef } from '@root/core/constants'

// 各设施的参数定义。radius 为沿路 BFS 覆盖步数；power/water 为自身消耗；
// powerOutput/waterOutput 为公用事业源的产能。
export const SERVICE_DEFS: Record<ServiceType, ServiceDef> = {
    [ServiceType.POWER]: {
        radius: 0, upkeep: 250, cost: 6000, power: 0, water: 0,
        powerOutput: 1400, waterOutput: 0, label: '燃煤电厂', color: [0.35, 0.33, 0.38],
    },
    [ServiceType.WATER]: {
        radius: 0, upkeep: 150, cost: 3000, power: 30, water: 0,
        powerOutput: 0, waterOutput: 1200, label: '水厂', color: [0.35, 0.55, 0.8],
    },
    [ServiceType.FIRE]: {
        radius: 18, upkeep: 90, cost: 1500, power: 10, water: 8,
        powerOutput: 0, waterOutput: 0, label: '消防局', color: [0.82, 0.25, 0.2],
    },
    [ServiceType.POLICE]: {
        radius: 18, upkeep: 90, cost: 1500, power: 10, water: 6,
        powerOutput: 0, waterOutput: 0, label: '警察局', color: [0.2, 0.32, 0.7],
    },
    [ServiceType.HEALTH]: {
        radius: 22, upkeep: 160, cost: 3000, power: 16, water: 12,
        powerOutput: 0, waterOutput: 0, label: '医院', color: [0.9, 0.9, 0.95],
    },
    [ServiceType.EDUCATION]: {
        radius: 20, upkeep: 130, cost: 2500, power: 14, water: 8,
        powerOutput: 0, waterOutput: 0, label: '学校', color: [0.85, 0.7, 0.3],
    },
    [ServiceType.PARK]: {
        radius: 9, upkeep: 30, cost: 600, power: 2, water: 4,
        powerOutput: 0, waterOutput: 0, label: '公园', color: [0.3, 0.6, 0.3],
    },
    [ServiceType.GARBAGE]: {
        radius: 20, upkeep: 110, cost: 2000, power: 18, water: 6,
        powerOutput: 0, waterOutput: 0, label: '垃圾处理', color: [0.5, 0.45, 0.35],
    },
    [ServiceType.TRANSIT]: {
        radius: 16, upkeep: 110, cost: 2000, power: 12, water: 4,
        powerOutput: 0, waterOutput: 0, label: '公交枢纽', color: [0.45, 0.7, 0.75],
    },
}

// 覆盖型服务（用于 ServiceSystem 计算覆盖场），不含电力/水这两种网络型公用事业
export const COVERAGE_SERVICES: ServiceType[] = [
    ServiceType.FIRE,
    ServiceType.POLICE,
    ServiceType.HEALTH,
    ServiceType.EDUCATION,
    ServiceType.PARK,
    ServiceType.GARBAGE,
    ServiceType.TRANSIT,
]
