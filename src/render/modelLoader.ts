import * as BABYLON from 'babylonjs'
import 'babylonjs-loaders'

// CC0 低多边形建筑模型（Kenney City Kit，via poly.pizza），由 webpack asset/resource 提供 URL。
import bldgSmall1 from '@root/assets/models/bldg_small_1.glb'
import bldgSmall2 from '@root/assets/models/bldg_small_2.glb'
import bldgSmall3 from '@root/assets/models/bldg_small_3.glb'
import bldgLow1 from '@root/assets/models/bldg_low_1.glb'
import bldgLow2 from '@root/assets/models/bldg_low_2.glb'
import bldgLarge1 from '@root/assets/models/bldg_large_1.glb'
import bldgLarge2 from '@root/assets/models/bldg_large_2.glb'
import bldgLarge3 from '@root/assets/models/bldg_large_3.glb'
import bldgWide1 from '@root/assets/models/bldg_wide_1.glb'
import tower1 from '@root/assets/models/tower_1.glb'
import tower2 from '@root/assets/models/tower_2.glb'
import tower3 from '@root/assets/models/tower_3.glb'
// CC0 独栋住宅（Kenney Suburban Houses Pack）
import house1 from '@root/assets/models/house_1.glb'
import house2 from '@root/assets/models/house_2.glb'
import house3 from '@root/assets/models/house_3.glb'
import house4 from '@root/assets/models/house_4.glb'
import house5 from '@root/assets/models/house_5.glb'
// CC0 农场（原料业，Quaternius Farm Buildings）
import farmBarn from '@root/assets/models/farm_barn.glb'
import farmSilo from '@root/assets/models/farm_silo.glb'
import farmBig from '@root/assets/models/farm_big.glb'
// CC0 车辆（Quaternius LowPoly Cars）
import car1 from '@root/assets/models/car_1.glb'
import car2 from '@root/assets/models/car_2.glb'
import carTaxi from '@root/assets/models/car_taxi.glb'
import carSuv from '@root/assets/models/car_suv.glb'
// CC-BY 设施（poly.pizza / Google Poly 存档，署名见 CREDITS）
import svcPower from '@root/assets/models/svc_power.glb'
import svcWater from '@root/assets/models/svc_water.glb'
import svcFire from '@root/assets/models/svc_fire.glb'
import svcPolice from '@root/assets/models/svc_police.glb'
import svcHealth from '@root/assets/models/svc_health.glb'
import svcEducation from '@root/assets/models/svc_education.glb'
import svcPark from '@root/assets/models/svc_park.glb'
import svcGarbage from '@root/assets/models/svc_garbage.glb'
import svcTransit from '@root/assets/models/svc_transit.glb'

const MANIFEST: Array<[string, string]> = [
    ['bldg_small_1', bldgSmall1],
    ['bldg_small_2', bldgSmall2],
    ['bldg_small_3', bldgSmall3],
    ['bldg_low_1', bldgLow1],
    ['bldg_low_2', bldgLow2],
    ['bldg_large_1', bldgLarge1],
    ['bldg_large_2', bldgLarge2],
    ['bldg_large_3', bldgLarge3],
    ['bldg_wide_1', bldgWide1],
    ['tower_1', tower1],
    ['tower_2', tower2],
    ['tower_3', tower3],
    ['house_1', house1],
    ['house_2', house2],
    ['house_3', house3],
    ['house_4', house4],
    ['house_5', house5],
    ['farm_barn', farmBarn],
    ['farm_silo', farmSilo],
    ['farm_big', farmBig],
    ['car_1', car1],
    ['car_2', car2],
    ['car_taxi', carTaxi],
    ['car_suv', carSuv],
    ['svc_power', svcPower],
    ['svc_water', svcWater],
    ['svc_fire', svcFire],
    ['svc_police', svcPolice],
    ['svc_health', svcHealth],
    ['svc_education', svcEducation],
    ['svc_park', svcPark],
    ['svc_garbage', svcGarbage],
    ['svc_transit', svcTransit],
]

// 把导入的（可能含多子网格 + 坐标系转换节点）GLB 合并成单个原型网格：
// 烘焙世界变换 → 归一化到 footprint≈0.92 格、基座 y=0、x/z 居中 → 作为 thin-instance 原型。
// 把（高成本/慢编译的）PBR 材质转为轻量 StandardMaterial：保留底色与贴图，统一扁平风格、消除着色器编译卡顿。
const toStandard = (mat: BABYLON.Material, scene: BABYLON.Scene): BABYLON.Material => {
    if (!mat) return mat
    const cls = mat.getClassName ? mat.getClassName() : ''
    if (cls.indexOf('PBR') >= 0) {
        const pbr = mat as unknown as {
            albedoColor?: BABYLON.Color3, albedoTexture?: BABYLON.BaseTexture,
            emissiveColor?: BABYLON.Color3, transparencyMode?: number, name: string,
        }
        const s = new BABYLON.StandardMaterial(pbr.name + '-std', scene)
        if (pbr.albedoColor) s.diffuseColor = pbr.albedoColor.clone()
        if (pbr.albedoTexture) s.diffuseTexture = pbr.albedoTexture as BABYLON.Texture
        if (pbr.emissiveColor) s.emissiveColor = pbr.emissiveColor.clone()
        s.specularColor = new BABYLON.Color3(0, 0, 0)
        if (pbr.transparencyMode != null) s.transparencyMode = pbr.transparencyMode
        return s
    }
    const multi = mat as unknown as { subMaterials?: BABYLON.Material[] }
    if (multi.subMaterials) {
        multi.subMaterials = multi.subMaterials.map((sm) => sm ? toStandard(sm, scene) : sm)
    }
    return mat
}

const prepareProto = (key: string, meshes: BABYLON.AbstractMesh[], scene: BABYLON.Scene): BABYLON.Mesh | null => {
    const real: BABYLON.Mesh[] = []
    for (const m of meshes) {
        if (m instanceof BABYLON.Mesh && m.getTotalVertices() > 0) {
            if (m.material) m.material = toStandard(m.material, scene)
            m.computeWorldMatrix(true)
            real.push(m)
        }
    }
    if (real.length === 0) return null

    const merged = BABYLON.Mesh.MergeMeshes(real, true, true, undefined, false, true)
    if (!merged) return null
    merged.refreshBoundingInfo()

    const bb = merged.getBoundingInfo().boundingBox
    const min = bb.minimum
    const max = bb.maximum
    const sizeX = max.x - min.x
    const sizeZ = max.z - min.z
    const scale = 0.92 / Math.max(sizeX, sizeZ, 0.001)

    merged.scaling.setAll(scale)
    merged.position.set(
        -((min.x + max.x) / 2) * scale,
        -min.y * scale,
        -((min.z + max.z) / 2) * scale
    )
    merged.bakeCurrentTransformIntoVertices()

    merged.name = key
    merged.isPickable = false
    merged.alwaysSelectAsActiveMesh = true
    merged.setEnabled(false)
    return merged
}

// 异步加载全部模型，返回 key→原型网格。任一失败仅告警并跳过（渲染层会回退到方块）。
export const loadModels = async (scene: BABYLON.Scene): Promise<Map<string, BABYLON.Mesh>> => {
    const out: Map<string, BABYLON.Mesh> = new Map()
    for (const [key, url] of MANIFEST) {
        try {
            const res = await BABYLON.SceneLoader.ImportMeshAsync('', '', url, scene)
            const proto = prepareProto(key, res.meshes, scene)
            if (proto) out.set(key, proto)
            // 清理导入残留的空变换节点（如 __root__）
            for (const m of res.meshes) {
                if (m && m !== proto && !m.isDisposed()) m.dispose()
            }
        } catch (e) {
            console.warn('[modelLoader] 模型加载失败，回退方块：', key, e)
        }
    }
    return out
}
