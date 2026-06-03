# 模型资源出处与许可

本目录下的 `.glb` 模型均为 **CC0 1.0 Universal（公共领域）**，可自由商用、修改，无需署名。仍在此致谢来源：

- **Kenney City Kit**（Suburban / Commercial / Roads）— 作者 Kenney（kenney.nl），CC0。
  本项目中的 `bldg_*.glb`、`tower_*.glb` 取自该套件，经 poly.pizza（https://poly.pizza）转存为 GLB。

如需扩充：
- 住宅：Kenney City Kit (Suburban)
- 商业：Kenney City Kit (Commercial)
- 工业/仓储：Quaternius（quaternius.com）厂房仓库
- 车辆：Quaternius LowPoly Cars / Kenney Car Kit

下载后放入本目录，并在 `src/render/modelLoader.ts` 的 MANIFEST 与
`src/render/cityRenderer.ts` 的 DESIRED_POOLS 中登记即可（缺失会自动回退方块占位）。
