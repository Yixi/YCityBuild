import * as BABYLON from 'babylonjs'

// 地面：唯一可拾取的 mesh（建造工具据此取格坐标）。逻辑数据放在 World，不再写 store。
export const initMap = (
    scene: BABYLON.Scene, mapWidth: number, mapHeight: number
): BABYLON.Mesh => {
    const ground = BABYLON.MeshBuilder.CreateGround(
        'ground', { width: mapWidth, height: mapHeight }, scene
    )
    const mat = new BABYLON.StandardMaterial('ground-material', scene)
    mat.diffuseColor = new BABYLON.Color3(0.34, 0.46, 0.30)
    mat.specularColor = new BABYLON.Color3(0, 0, 0)
    ground.material = mat
    ground.position = new BABYLON.Vector3(mapWidth / 2, 0, mapHeight / 2)
    return ground
}
