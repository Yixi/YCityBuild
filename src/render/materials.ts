import * as BABYLON from 'babylonjs'

// 共享材质池：按 key 缓存并冻结，杜绝逐格 new StandardMaterial。
export class MaterialLib {
    private cache: Map<string, BABYLON.StandardMaterial> = new Map()

    constructor(private scene: BABYLON.Scene) {}

    get(key: string, color: [number, number, number]): BABYLON.StandardMaterial {
        let m = this.cache.get(key)
        if (m) return m
        m = new BABYLON.StandardMaterial(key, this.scene)
        m.diffuseColor = new BABYLON.Color3(color[0], color[1], color[2])
        m.specularColor = new BABYLON.Color3(0, 0, 0)
        m.freeze()
        this.cache.set(key, m)
        return m
    }

    getAlpha(key: string, color: [number, number, number], alpha: number): BABYLON.StandardMaterial {
        let m = this.cache.get(key)
        if (m) return m
        m = new BABYLON.StandardMaterial(key, this.scene)
        m.diffuseColor = new BABYLON.Color3(color[0], color[1], color[2])
        m.emissiveColor = new BABYLON.Color3(color[0] * 0.4, color[1] * 0.4, color[2] * 0.4)
        m.specularColor = new BABYLON.Color3(0, 0, 0)
        m.alpha = alpha
        m.freeze()
        this.cache.set(key, m)
        return m
    }
}
