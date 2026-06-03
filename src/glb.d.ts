// 让 TS 接受 `import url from './x.glb'`（由 webpack asset/resource 提供 URL）
declare module '*.glb' {
    const url: string
    export default url
}
