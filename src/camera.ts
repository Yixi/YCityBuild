import * as BABYLON from 'babylonjs'

// 增强相机：保留 ArcRotateCamera，但左键留给建造工具，右键/中键旋转，滚轮缩放，WASD/方向键平移。
export const initCamera = (
    scene: BABYLON.Scene,
    canvas: HTMLCanvasElement,
    mapWidth: number,
    mapHeight: number
): BABYLON.ArcRotateCamera => {
    const camera = new BABYLON.ArcRotateCamera(
        'Camera',
        Math.PI / 4,
        Math.PI / 180 * 52,
        50,
        new BABYLON.Vector3(mapWidth / 2, 0, mapHeight / 2),
        scene
    )
    camera.attachControl(canvas, true)
    camera.lowerRadiusLimit = 8
    camera.upperRadiusLimit = 95
    camera.lowerBetaLimit = 0.15
    camera.upperBetaLimit = 1.45
    camera.wheelDeltaPercentage = 0.02
    camera.panningSensibility = 0   // 关闭内置平移，改用 WASD

    // 旋转仅响应中键(1)/右键(2)，左键(0)完全交给建造工具，避免误触旋转
    const ptr = camera.inputs.attached.pointers as unknown as { buttons?: number[] }
    if (ptr) ptr.buttons = [1, 2]

    // —— 键盘平移 ——
    const keys: Set<string> = new Set()
    window.addEventListener('keydown', (e: KeyboardEvent) => keys.add(e.key.toLowerCase()))
    window.addEventListener('keyup', (e: KeyboardEvent) => keys.delete(e.key.toLowerCase()))

    const clamp = (v: number, min: number, max: number): number => v < min ? min : v > max ? max : v

    scene.onBeforeRenderObservable.add(() => {
        let dx = 0
        let dz = 0
        if (keys.has('w') || keys.has('arrowup')) dz -= 1
        if (keys.has('s') || keys.has('arrowdown')) dz += 1
        if (keys.has('a') || keys.has('arrowleft')) dx -= 1
        if (keys.has('d') || keys.has('arrowright')) dx += 1
        if (dx === 0 && dz === 0) return
        const speed = camera.radius * 0.012
        const sin = Math.sin(camera.alpha)
        const cos = Math.cos(camera.alpha)
        const moveX = (dx * cos - dz * sin) * speed
        const moveZ = (dx * sin + dz * cos) * speed
        camera.target.x = clamp(camera.target.x + moveX, 0, mapWidth)
        camera.target.z = clamp(camera.target.z + moveZ, 0, mapHeight)
    })

    return camera
}
