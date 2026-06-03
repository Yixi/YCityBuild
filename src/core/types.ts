// 核心枚举与数据结构

// 一个格子的占用类型
export enum CellKind {
    EMPTY,
    ROAD,
    BUILDING,   // 分区上自动生长出的楼房
    SERVICE,    // 玩家放置的设施（电厂/水厂/消防…）
    TREE,
    WATER,
    RUBBLE,     // 火灾/拆除后的废墟
}

// 分区类型
export enum ZoneType {
    NONE,
    R,  // 住宅
    C,  // 商业
    I,  // 工业
}

// 道路外观（与原 demo 的 ROAD_TYPE 对应）
export enum RoadShape {
    HORIZONTAL,
    VERTICAL,
    CONNER,
    T_INTERSECTION,
    CROSSROAD,
}

// 建筑生命周期状态
export enum BuildingState {
    CONSTRUCTING,
    ACTIVE,
    ABANDONED,
    ONFIRE,
}

// 设施类型（含发电厂/水厂等公用事业源）
export enum ServiceType {
    POWER,      // 燃煤电厂
    WATER,      // 水厂
    FIRE,       // 消防
    POLICE,     // 警察
    HEALTH,     // 医院
    EDUCATION,  // 学校
    PARK,       // 公园（提升地价）
    GARBAGE,    // 垃圾处理
    TRANSIT,    // 公交枢纽（降低周边交通）
}

// 单个建筑/设施的富信息（独立于网格 typed-array 存储）
export interface Building {
    id: number
    cell: number          // 所在格 idx
    x: number
    z: number
    zone: ZoneType        // R/C/I（生长建筑）；NONE（设施）
    isService: boolean
    service: ServiceType  // isService 时有效
    level: number         // 1..MAX_LEVEL
    progress: number      // 建造进度 0..1
    state: BuildingState
    capacity: number      // 满级容纳的居民或岗位
    occupancy: number     // 当前入住/在岗（0..capacity）
    roadCell: number      // 相邻道路格 idx，-1 表示不临路
    powered: boolean
    watered: boolean
    unhealthyDays: number // 持续不健康天数（用于衰败）
    fireDays: number      // 着火天数
    happiness: number     // 0..1
}

// 工具标识
export enum ToolId {
    NONE,
    ROAD,
    ZONE_R,
    ZONE_C,
    ZONE_I,
    SERVICE,
    BULLDOZE,
    QUERY,
}
