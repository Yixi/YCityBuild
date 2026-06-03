# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指引。

## 项目简介

YCityBuilding 是一个基于 **Babylon.js** 的 3D 城市建造 demo / 小游戏。运行后会渲染一张
100×100 的地图，随机生成树木，根据预设数据绘制道路，并支持**点击地面建造道路**——道路的
外观（水平 / 垂直 / 转角 / 丁字 / 十字）会根据其上下左右相邻格子的情况**动态计算**。
右上角实时显示 FPS。

## 技术栈

| 类别 | 选型 |
|------|------|
| 语言 | TypeScript 6（非严格模式，仅开启 `noImplicitAny`） |
| 3D 引擎 | Babylon.js 9（`babylonjs` UMD 包） |
| 工具库 | lodash |
| 打包 | webpack 5 + webpack-cli + webpack-dev-server |
| TS 编译 | ts-loader（`transpileOnly`）+ fork-ts-checker-webpack-plugin（独立进程类型检查） |
| 代码检查 | ESLint 10 + typescript-eslint + @stylistic（扁平配置 `eslint.config.mjs`） |
| Git 钩子 | husky 9 + lint-staged |
| 包管理 | **pnpm**（请勿使用 npm / yarn） |

## 常用命令

```bash
pnpm install        # 安装依赖（会通过 prepare 脚本自动安装 husky 钩子）
pnpm dev            # 启动开发服务器：http://localhost:4233（HMR 热更新）
pnpm start          # 等价于 pnpm dev
pnpm build          # 生产构建，输出到 dist/
pnpm lint           # ESLint 检查
pnpm lint:fix       # ESLint 自动修复
pnpm typecheck      # tsc --noEmit 类型检查
```

> ts-loader 使用 `transpileOnly`，构建时不做类型检查；类型错误由 fork-ts-checker
> 在独立进程中报告，CI 中再由 `pnpm typecheck` 兜底。

## 目录结构

```
src/
  index.ts          # 入口：创建 Engine / Scene，启动渲染循环，刷新 FPS
  scene.ts          # 组装场景：地图 → 相机 → 灯光 → 道路 → 树 → 点击建路
  camera.ts         # ArcRotateCamera 弧形旋转相机
  road.ts           # 道路类型/旋转的动态计算、点击建路、周边重建
  trees.ts          # 随机生成 100~300 棵树
  app.html          # HTML 模板（#renderCanvas 画布 + #fps）
  model/
    road.ts         # 各类道路网格（几何体）的创建 + ROAD_TYPE 枚举
    tree.ts         # 树网格的创建
    map.ts          # 地面与地图数据初始化
    type.ts         # MESH_TYPE 枚举（ROAD / TREE）
  data/
    store.ts        # 全局状态单例：地图二维数组 + 预设道路坐标
build/
  webpack.dev.js    # 开发环境 webpack 配置
  webpack.build.js  # 生产环境 webpack 配置
eslint.config.mjs   # ESLint 扁平配置
.husky/             # git 钩子（pre-commit / pre-push）
```

## 核心架构

- **全局状态**集中在 `src/data/store.ts` 导出的单例 `store`：
  - `store.map` 是 `IMapData[][]` 二维数组，按 `map[x][z]` 访问；每格含 `{ x, y, mesh?, meshType?, info? }`。
  - `store.road` 是预设的道路坐标 `[x, z][]`，初始道路据此绘制。
  - 建造任何物体时，都通过写入 `store.map[x][z].meshType` 与 `.mesh` 来登记格子的占用情况。
- **坐标系**：`x` / `z` 为水平面坐标，`y` 为高度。每个格子边长为 1。
- **道路类型动态计算**（`road.ts` 的 `calculateRoadType`）：
  - 读取四个邻居 `around = [+x, -z, -x, +z]`（即 右、上、左、下，**顺序固定，旋转计算依赖此顺序**）。
  - 按相邻道路数量判定 `ROAD_TYPE`（HORIZONTAL / VERTICAL / CONNER / T_INTERSECTION / CROSSROAD）及旋转角 `rotate`。
- **点击建路**（`clickToBuildRoad`）：监听 `POINTERTAP`，对拾取点取整得到格子坐标，标记为道路后调用
  `rebuildSurroundingArea` 重建该格周围 3×3 区域的道路网格，使相邻道路外观随之更新。
- **网格创建**：道路 / 树均由多个基础几何体经 `BABYLON.Mesh.MergeMeshes` 合并而成；树以一个
  `baseTree` 为模板 `clone()` 批量生成。

## 路径别名

`@root/*` → `src/*`，**在两处同时配置，修改时必须保持一致**：
- `tsconfig.json` 的 `compilerOptions.paths`
- `build/webpack.dev.js` 与 `build/webpack.build.js` 的 `resolve.alias`

## 代码风格约定

- **无分号**、**单引号**（由 ESLint 的 `@stylistic` 规则强制）。
- 源码（`src/`）使用 **4 空格**缩进；构建/配置文件（`build/`、`eslint.config.mjs`）使用 **2 空格**。
- TypeScript 为**非严格模式**（`strict: false`），访问 Babylon 可空返回值时无需空值判断——
  请沿用此风格，不要随意开启 `strictNullChecks`，否则现有源码会出现大量空值报错。
- ESLint 已关闭 `no-explicit-any` 与 `no-inferrable-types`，以适配 Babylon 的动态结构与项目原有写法。

## 注意事项（gotchas）

- 新增依赖请用 `pnpm add` / `pnpm add -D`，不要混用 npm 或 yarn。
- `babylonjs` 的安装脚本会被 pnpm 默认忽略（仅为捐赠提示），**不影响构建**，无需处理。
- 道路类型计算会直接访问越界邻居（如 `store.map[x+1]`），**默认坐标不在地图边界**；预设道路位于地图中心，
  若要在边缘建路需自行加边界保护。
- 生产构建中 Babylon 以单文件形式打包（约 8 MB，无法再被 webpack 切分），构建时的 size 警告可忽略。

## 部署

CI 由 `.github/workflows/main.yml` 定义：当代码 push 到 `master` 时，依次执行
`pnpm install → pnpm lint → pnpm typecheck → pnpm build`，再将 `dist/` 发布到 `gh-pages` 分支
（GitHub Pages）。
