import { xOf, zOf } from '@root/core/grid'
import { LANE_OFFSET } from '@root/core/constants'

// 车道折线：把路线的格序列转成「向右偏移（双向分离）+ 路口圆角」的连续折线，并预存弧长。
export interface LanePath {
    pts: number[]   // 扁平 [x0,z0, x1,z1, ...]
    cum: number[]   // 各点累计弧长
    total: number
}

const normDir = (dx: number, dz: number): [number, number] => {
    const l = Math.hypot(dx, dz) || 1
    return [dx / l, dz / l]
}

// 行驶方向的右手侧（右行制：双向车流分到路中线两侧）
const rightOf = (dx: number, dz: number): [number, number] => [dz, -dx]

export const buildLanePath = (cellPath: number[]): LanePath => {
    const n = cellPath.length
    const pts: number[] = []
    const cx = (i: number): number => xOf(cellPath[i])
    const cz = (i: number): number => zOf(cellPath[i])

    if (n < 2) {
        if (n === 1) pts.push(cx(0), cz(0))
        return { pts, cum: [0], total: 0 }
    }

    for (let i = 0; i < n; i++) {
        const inX = i > 0 ? cx(i) - cx(i - 1) : cx(i + 1) - cx(i)
        const inZ = i > 0 ? cz(i) - cz(i - 1) : cz(i + 1) - cz(i)
        const outX = i < n - 1 ? cx(i + 1) - cx(i) : cx(i) - cx(i - 1)
        const outZ = i < n - 1 ? cz(i + 1) - cz(i) : cz(i) - cz(i - 1)
        const [ix, iz] = normDir(inX, inZ)
        const [ox, oz] = normDir(outX, outZ)
        const [rix, riz] = rightOf(ix, iz)
        const [rox, roz] = rightOf(ox, oz)
        const turning = Math.abs(ix - ox) > 0.01 || Math.abs(iz - oz) > 0.01
        const X = cx(i)
        const Z = cz(i)
        if (!turning) {
            pts.push(X + rox * LANE_OFFSET, Z + roz * LANE_OFFSET)
        } else {
            // 入边偏移 → 圆角 → 出边偏移，路口内转弯
            pts.push(X + rix * LANE_OFFSET, Z + riz * LANE_OFFSET)
            pts.push(X + (rix + rox) * 0.35 * LANE_OFFSET, Z + (riz + roz) * 0.35 * LANE_OFFSET)
            pts.push(X + rox * LANE_OFFSET, Z + roz * LANE_OFFSET)
        }
    }

    const cum: number[] = [0]
    let total = 0
    const count = pts.length / 2
    for (let k = 1; k < count; k++) {
        const dx = pts[k * 2] - pts[(k - 1) * 2]
        const dz = pts[k * 2 + 1] - pts[(k - 1) * 2 + 1]
        total += Math.hypot(dx, dz)
        cum.push(total)
    }
    return { pts, cum, total }
}

// 采样：给定弧长 s，写入位置与单位航向到 out=[x,z,hx,hz]，返回所在段索引（供单调推进缓存）
export const sampleLane = (lane: LanePath, s: number, fromSeg: number, out: number[]): number => {
    const { pts, cum } = lane
    const last = cum.length - 1
    if (s < 0) s = 0
    if (s > lane.total) s = lane.total
    let seg = fromSeg < 1 ? 1 : fromSeg
    while (seg < last && cum[seg] < s) seg++
    while (seg > 1 && cum[seg - 1] > s) seg--
    const i0 = seg - 1
    const i1 = seg
    const segLen = cum[i1] - cum[i0] || 1
    const t = (s - cum[i0]) / segLen
    const ax = pts[i0 * 2]
    const az = pts[i0 * 2 + 1]
    const bx = pts[i1 * 2]
    const bz = pts[i1 * 2 + 1]
    out[0] = ax + (bx - ax) * t
    out[1] = az + (bz - az) * t
    const hx = bx - ax
    const hz = bz - az
    const l = Math.hypot(hx, hz) || 1
    out[2] = hx / l
    out[3] = hz / l
    return seg
}
