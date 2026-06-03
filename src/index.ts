import * as BABYLON from 'babylonjs'
import { createScene } from '@root/scene'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
const fps = document.getElementById('fps')

const engine = new BABYLON.Engine(canvas, true)

// 加载界面（模型异步加载期间显示）
const loading = document.createElement('div')
loading.textContent = '正在加载城市模型…'
Object.assign(loading.style, {
    position: 'fixed', inset: '0', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0e1116', color: '#e8edf2',
    font: '16px system-ui, sans-serif', zIndex: '100',
})
document.body.appendChild(loading)

createScene(engine, canvas).then((game) => {
    loading.remove()
    engine.runRenderLoop(() => {
        const dt = engine.getDeltaTime() / 1000
        game.frame(dt)
        game.scene.render()
        if (fps) fps.textContent = engine.getFps().toFixed() + ' fps'
    })
})

window.addEventListener('resize', () => engine.resize())
