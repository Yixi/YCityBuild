import { World } from '@root/core/world'
import { Building, BuildingState, ZoneType } from '@root/core/types'
import { clamp } from '@root/sim/util'
import {
    RAW_OUTPUT_PER_WORKER, GOODS_PER_WORKER, RAW_PER_GOOD, CONSUMPTION_PER_CUSTOMER,
    MAX_STOCK, IMPORT_COST_RAW, IMPORT_COST_GOODS, EXPORT_PRICE_GOODS,
} from '@root/core/constants'

// 配送效率：用建筑临路格拥堵近似（无路则中等），0.3..1
const logisticsEff = (world: World, b: Building): number => {
    if (b.roadCell < 0) return 0.5
    return clamp(1 - world.traffic[b.roadCell] * 0.6, 0.3, 1)
}

// 三级供应链：原料业产原料 → 工厂耗原料产货物 → 商店进货物售予居民。
// 缺口由进口兜底（花钱），过剩出口（赚钱），均记入月度结算。
export const updateSupply = (world: World): void => {
    let importSpend = 0
    let exportEarn = 0

    // 1) 原料业产原料（存入自身 goodsStock 作为原料库存）
    world.forEachBuilding((b) => {
        if (b.isService || b.zone !== ZoneType.RAW || b.state !== BuildingState.ACTIVE) return
        const out = b.powered ? b.occupancy * RAW_OUTPUT_PER_WORKER : 0
        b.production = out
        b.goodsStock = Math.min(MAX_STOCK, b.goodsStock + out)
    })

    // 2) 工厂取原料、产货物
    world.forEachBuilding((b) => {
        if (b.isService || b.zone !== ZoneType.I || b.state !== BuildingState.ACTIVE) return
        const need = b.occupancy * GOODS_PER_WORKER * RAW_PER_GOOD
        let got = 0
        const sup = b.supplierId >= 0 ? world.buildings[b.supplierId] : null
        if (sup && sup.goodsStock > 0) {
            got = Math.min(need * logisticsEff(world, b), sup.goodsStock)
            sup.goodsStock -= got
        }
        const imported = Math.max(0, need - got)
        importSpend += imported * IMPORT_COST_RAW
        b.rawStock = Math.min(MAX_STOCK, b.rawStock + got + imported)
        b.shortage = need > 0 ? clamp(1 - got / need, 0, 1) : 0

        const goods = Math.min(b.powered ? b.occupancy * GOODS_PER_WORKER : 0, b.rawStock / RAW_PER_GOOD)
        b.rawStock -= goods * RAW_PER_GOOD
        b.production = goods
        b.goodsStock = Math.min(MAX_STOCK, b.goodsStock + goods)
    })

    // 3) 商店取货物、售予居民
    world.forEachBuilding((b) => {
        if (b.isService || b.zone !== ZoneType.C || b.state !== BuildingState.ACTIVE) return
        const need = b.customerCount * CONSUMPTION_PER_CUSTOMER + 2
        let got = 0
        const sup = b.supplierId >= 0 ? world.buildings[b.supplierId] : null
        if (sup && sup.goodsStock > 0) {
            got = Math.min(need * logisticsEff(world, b), sup.goodsStock)
            sup.goodsStock -= got
        }
        // 商店只能少量进口（鼓励本地工业供货）
        const imported = Math.max(0, need * 0.6 - got)
        importSpend += imported * IMPORT_COST_GOODS
        b.goodsStock = Math.min(MAX_STOCK, b.goodsStock + got + imported)
        b.shortage = need > 0 ? clamp(1 - (got + imported) / need, 0, 1) : 0

        const sold = Math.min(b.goodsStock, b.customerCount * CONSUMPTION_PER_CUSTOMER)
        b.goodsStock -= sold
        b.production = sold
    })

    // 4) 原料业/工厂库存满溢 → 出口换钱
    world.forEachBuilding((b) => {
        if (b.isService) return
        if ((b.zone === ZoneType.RAW || b.zone === ZoneType.I) && b.goodsStock > MAX_STOCK * 0.95) {
            const surplus = b.goodsStock - MAX_STOCK * 0.8
            b.goodsStock -= surplus
            exportEarn += surplus * EXPORT_PRICE_GOODS * 0.5
        }
    })

    world.importSpend += importSpend
    world.exportEarn += exportEarn
}
