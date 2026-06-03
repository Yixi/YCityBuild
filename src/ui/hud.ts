import { World } from '@root/core/world'
import { InteractionController } from '@root/interaction/controller'
import { SimClock } from '@root/core/clock'
import { OverlayManager, OverlayLayer, OVERLAY_LABELS } from '@root/render/overlay'
import { BuildingState, ServiceType, ToolId, ZoneType } from '@root/core/types'
import { SERVICE_DEFS } from '@root/core/serviceDefs'

export interface HudContext {
    world: World
    controller: InteractionController
    clock: SimClock
    overlay: OverlayManager
    save: () => void
    load: () => void
}

const CSS = `
#hud{position:fixed;inset:0;pointer-events:none;font-family:system-ui,-apple-system,sans-serif;color:#e8edf2;user-select:none;z-index:10}
#hud .panel{pointer-events:auto;background:rgba(20,26,34,.88);border:1px solid rgba(255,255,255,.08);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.3)}
#hud .top{position:fixed;top:8px;left:8px;display:flex;gap:18px;align-items:center;padding:8px 16px}
#hud .stat{display:flex;flex-direction:column;font-size:11px;color:#9fb0c0;line-height:1.4}
#hud .stat b{font-size:15px;color:#e8edf2}
#hud .rci{display:flex;gap:8px;align-items:center}
#hud .bar{width:46px;height:7px;border-radius:4px;background:#2b3440;overflow:hidden}
#hud .bar i{display:block;height:100%}
#hud .bottom{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;padding:8px}
#hud .sub{position:fixed;bottom:64px;left:50%;transform:translateX(-50%);display:none;gap:6px;padding:8px;flex-wrap:wrap;max-width:680px;justify-content:center}
#hud .btn{pointer-events:auto;background:#2a3340;color:#e8edf2;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:8px 12px;font-size:13px;cursor:pointer;white-space:nowrap}
#hud .btn:hover{background:#34404f}
#hud .btn.active{background:#3b6fb0;border-color:#6aa0e6}
#hud .right{position:fixed;right:8px;top:72px;display:flex;flex-direction:column;gap:6px;align-items:stretch}
#hud .right .row{display:flex;gap:6px}
#hud .info{position:fixed;left:8px;bottom:78px;width:230px;padding:12px 14px;font-size:12px;line-height:1.7;display:none}
#hud .info h4{margin:0 0 6px;font-size:13px}
#hud .msg{position:fixed;left:50%;transform:translateX(-50%);bottom:70px;font-size:12px;color:#ffe8a0;text-shadow:0 1px 3px #000;pointer-events:none}
#hud .modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;pointer-events:auto;background:rgba(0,0,0,.45)}
#hud .modal .panel{padding:18px 20px;width:320px}
#hud .modal h3{margin:0 0 12px}
#hud .modal label{display:flex;justify-content:space-between;align-items:center;font-size:13px;margin:8px 0;gap:10px}
#hud .modal input[type=range]{width:130px}
#fps{background:transparent!important;color:#86efac!important;width:auto!important;height:auto!important;right:10px!important;top:8px!important;font-size:11px;text-align:right}
`

const ZONE_NAME: Record<number, string> = {
    [ZoneType.NONE]: '空地', [ZoneType.R]: '住宅', [ZoneType.C]: '商业', [ZoneType.I]: '工业',
}
const STATE_NAME: Record<number, string> = {
    [BuildingState.CONSTRUCTING]: '建造中', [BuildingState.ACTIVE]: '运营中',
    [BuildingState.ABANDONED]: '废弃', [BuildingState.ONFIRE]: '🔥火灾',
}

const LAYER_ORDER: OverlayLayer[] = [
    OverlayLayer.NONE, OverlayLayer.POWER, OverlayLayer.WATER, OverlayLayer.POLLUTION,
    OverlayLayer.LANDVALUE, OverlayLayer.TRAFFIC, OverlayLayer.SERVICES,
]

const SERVICE_ORDER: ServiceType[] = [
    ServiceType.POWER, ServiceType.WATER, ServiceType.FIRE, ServiceType.POLICE,
    ServiceType.HEALTH, ServiceType.EDUCATION, ServiceType.PARK, ServiceType.GARBAGE,
    ServiceType.TRANSIT,
]

export class Hud {
    private root: HTMLDivElement
    private el: Record<string, HTMLElement> = {}
    private toolBtns: Map<ToolId, HTMLButtonElement> = new Map()
    private serviceBtn: HTMLButtonElement
    private speedBtns: HTMLButtonElement[] = []
    private layerIndex = 0

    constructor(private ctx: HudContext) {
        const style = document.createElement('style')
        style.textContent = CSS
        document.head.appendChild(style)

        this.root = document.createElement('div')
        this.root.id = 'hud'
        document.body.appendChild(this.root)

        this.buildTop()
        this.buildToolbar()
        this.buildRight()
        this.buildInfo()
        this.buildModal()
        this.buildMsg()
    }

    private mk<T extends HTMLElement>(tag: string, cls?: string, parent?: HTMLElement): T {
        const e = document.createElement(tag) as T
        if (cls) e.className = cls
        ;(parent || this.root).appendChild(e)
        return e
    }

    private btn(label: string, parent: HTMLElement, onClick: () => void): HTMLButtonElement {
        const b = this.mk<HTMLButtonElement>('button', 'btn', parent)
        b.textContent = label
        b.onclick = onClick
        return b
    }

    private stat(parent: HTMLElement, label: string, key: string): void {
        const s = this.mk('div', 'stat', parent)
        const b = this.mk<HTMLElement>('b', undefined, s)
        this.el[key] = b
        const l = this.mk<HTMLElement>('span', undefined, s)
        l.textContent = label
    }

    private buildTop(): void {
        const top = this.mk('div', 'panel top')
        this.stat(top, '资金', 'money')
        this.stat(top, '收支/月', 'balance')
        this.stat(top, '人口', 'pop')
        this.stat(top, '岗位', 'jobs')
        this.stat(top, '幸福', 'happy')
        this.stat(top, '电力', 'power')
        this.stat(top, '供水', 'water')
        this.stat(top, '日期', 'date')
        this.stat(top, '等级', 'tier')
        // RCI 需求条
        const rci = this.mk('div', 'rci', top)
        for (const k of ['R', 'C', 'I']) {
            const wrap = this.mk('div', 'stat', rci)
            const bar = this.mk('div', 'bar', wrap)
            const fill = this.mk<HTMLElement>('i', undefined, bar)
            this.el['rci' + k] = fill
            const l = this.mk<HTMLElement>('span', undefined, wrap)
            l.textContent = k
        }
    }

    private buildToolbar(): void {
        const bar = this.mk('div', 'panel bottom')
        const addTool = (label: string, tool: ToolId): void => {
            const b = this.btn(label, bar, () => this.ctx.controller.setTool(tool))
            this.toolBtns.set(tool, b)
        }
        addTool('🔍查询', ToolId.QUERY)
        addTool('🛣道路', ToolId.ROAD)
        addTool('🏠住宅', ToolId.ZONE_R)
        addTool('🏢商业', ToolId.ZONE_C)
        addTool('🏭工业', ToolId.ZONE_I)
        this.serviceBtn = this.btn('⚙设施▾', bar, () => this.toggleSub())
        addTool('💥拆除', ToolId.BULLDOZE)

        // 设施子菜单
        const sub = this.mk('div', 'panel sub')
        this.el.sub = sub
        for (const t of SERVICE_ORDER) {
            const def = SERVICE_DEFS[t]
            this.btn(`${def.label}（¥${def.cost}）`, sub, () => {
                this.ctx.controller.setService(t)
                sub.style.display = 'none'
            })
        }
    }

    private toggleSub(): void {
        const sub = this.el.sub
        sub.style.display = sub.style.display === 'flex' ? 'none' : 'flex'
    }

    private buildRight(): void {
        const right = this.mk('div', 'right')
        const speed = this.mk('div', 'panel row', right)
        const labels = ['⏸', '▶', '▶▶', '▶▶▶']
        for (let i = 0; i < 4; i++) {
            const b = this.btn(labels[i], speed, () => this.ctx.clock.setSpeed(i))
            this.speedBtns.push(b)
        }
        const layerRow = this.mk('div', 'panel row', right)
        this.el.layer = this.btn('图层:无', layerRow, () => this.cycleLayer())
        const ioRow = this.mk('div', 'panel row', right)
        this.btn('💾存档', ioRow, () => this.ctx.save())
        this.btn('📂读档', ioRow, () => this.ctx.load())
        const polRow = this.mk('div', 'panel row', right)
        this.btn('📋政策/税收', polRow, () => { this.el.modal.style.display = 'flex' })
    }

    private cycleLayer(): void {
        this.layerIndex = (this.layerIndex + 1) % LAYER_ORDER.length
        const layer = LAYER_ORDER[this.layerIndex]
        this.ctx.overlay.setLayer(layer, this.ctx.world)
        this.el.layer.textContent = '图层:' + OVERLAY_LABELS[layer]
    }

    private buildInfo(): void {
        this.el.info = this.mk('div', 'panel info')
    }

    private buildMsg(): void {
        this.el.msg = this.mk('div', 'msg')
    }

    private buildModal(): void {
        const modal = this.mk('div', 'modal')
        this.el.modal = modal
        const panel = this.mk('div', 'panel', modal)
        const h = this.mk<HTMLElement>('h3', undefined, panel)
        h.textContent = '政策与税收'
        const w = this.ctx.world

        const toggle = (label: string, key: string): void => {
            const lab = this.mk<HTMLLabelElement>('label', undefined, panel)
            lab.textContent = label
            const cb = this.mk<HTMLInputElement>('input', undefined, lab)
            cb.type = 'checkbox'
            cb.checked = w.policies[key]
            cb.onchange = () => { w.policies[key] = cb.checked }
        }
        toggle('垃圾回收（减污染，增支出）', 'recycling')
        toggle('工业禁排（减污染）', 'smokeFree')
        toggle('免费公交（降交通）', 'freeTransit')
        toggle('高税率（增税25%）', 'highTax')

        const slider = (label: string, get: () => number, set: (v: number) => void): void => {
            const lab = this.mk<HTMLLabelElement>('label', undefined, panel)
            const span = this.mk<HTMLElement>('span', undefined, lab)
            const rng = this.mk<HTMLInputElement>('input', undefined, lab)
            rng.type = 'range'; rng.min = '0'; rng.max = '20'; rng.step = '1'
            rng.value = String(Math.round(get() * 100))
            const refresh = (): void => { span.textContent = `${label} ${Math.round(get() * 100)}%` }
            refresh()
            rng.oninput = () => { set(parseInt(rng.value, 10) / 100); refresh() }
        }
        slider('住宅税', () => w.taxRates.r, (v) => { w.taxRates.r = v })
        slider('商业税', () => w.taxRates.c, (v) => { w.taxRates.c = v })
        slider('工业税', () => w.taxRates.i, (v) => { w.taxRates.i = v })

        const close = this.btn('关闭', panel, () => { modal.style.display = 'none' })
        close.style.marginTop = '12px'
    }

    private describe(world: World, cell: number): string {
        const x = Math.floor(cell / world.size)
        const z = cell % world.size
        const lv = Math.round(world.landValue[cell])
        const pol = Math.round(world.pollution[cell])
        let body = ''
        if (world.road[cell] === 1) {
            body = `<b>道路</b><br>通电:${world.powered[cell] ? '是' : '否'} 通水:${world.watered[cell] ? '是' : '否'}<br>拥堵:${Math.round(world.traffic[cell] * 100)}%`
        } else if (world.buildingId[cell] >= 0) {
            const b = world.getBuilding(cell)
            if (b && b.isService) {
                body = `<b>${SERVICE_DEFS[b.service].label}</b><br>状态:运营中`
            } else if (b) {
                body = `<b>${ZONE_NAME[b.zone]} Lv${b.level}</b><br>`
                    + `${STATE_NAME[b.state]} ${Math.round(b.occupancy)}/${b.capacity}<br>`
                    + `供电:${b.powered ? '✔' : '✘'} 供水:${b.watered ? '✔' : '✘'}<br>`
                    + `幸福:${Math.round(b.happiness * 100)}%`
            }
        } else if (world.zone[cell] !== ZoneType.NONE) {
            body = `<b>${ZONE_NAME[world.zone[cell]]}区（待开发）</b>`
        } else if (world.tree[cell] === 1) {
            body = '<b>树木</b>'
        } else {
            body = '<b>空地</b>'
        }
        return `<h4>(${x}, ${z})</h4>${body}<br><span style="color:#9fb0c0">地价 ${lv} · 污染 ${pol}</span>`
    }

    update(): void {
        const w = this.ctx.world
        const money = Math.round(w.money)
        this.el.money.textContent = '¥' + money.toLocaleString('en-US')
        this.el.money.style.color = money < 0 ? '#ff8a8a' : '#e8edf2'
        const net = w.lastIncome - w.lastExpense
        this.el.balance.textContent = (net >= 0 ? '+' : '') + net.toLocaleString('en-US')
        this.el.balance.style.color = net >= 0 ? '#86efac' : '#ff8a8a'
        this.el.pop.textContent = w.population.toLocaleString('en-US')
        this.el.jobs.textContent = w.jobs.toLocaleString('en-US')
        this.el.happy.textContent = Math.round(w.happiness * 100) + '%'
        this.el.power.textContent = `${w.powerDemand}/${w.powerSupply}`
        this.el.power.style.color = w.powerDemand > w.powerSupply ? '#ff8a8a' : '#86efac'
        this.el.water.textContent = `${w.waterDemand}/${w.waterSupply}`
        this.el.water.style.color = w.waterDemand > w.waterSupply ? '#ff8a8a' : '#86efac'
        this.el.date.textContent = `${w.year}年${w.month + 1}月${w.day + 1}日`
        this.el.tier.textContent = w.milestoneName

        const setBar = (k: string, val: number, color: string): void => {
            const i = this.el['rci' + k] as HTMLElement
            i.style.width = Math.round((val + 1) / 2 * 100) + '%'
            i.style.background = color
        }
        setBar('R', w.demand.r, '#4ade80')
        setBar('C', w.demand.c, '#60a5fa')
        setBar('I', w.demand.i, '#fbbf24')

        // 工具高亮
        this.toolBtns.forEach((b, tool) => {
            b.classList.toggle('active', this.ctx.controller.activeTool === tool)
        })
        this.serviceBtn.classList.toggle('active', this.ctx.controller.activeTool === ToolId.SERVICE)

        // 变速高亮
        this.speedBtns.forEach((b, i) => b.classList.toggle('active', this.ctx.clock.speed === i))

        // 信息面板
        if (w.selection >= 0) {
            this.el.info.style.display = 'block'
            this.el.info.innerHTML = this.describe(w, w.selection)
        } else {
            this.el.info.style.display = 'none'
        }

        // 消息
        this.el.msg.textContent = w.messages.length > 0 ? w.messages[0] : ''
    }
}
