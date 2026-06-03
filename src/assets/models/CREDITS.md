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

---

## 设施模型（CC-BY 3.0，需署名）

以下 `svc_*.glb` 为 **CC-BY 3.0** 授权（可商用，**需署名原作者**），来自 Google Poly 存档，经
[poly.pizza](https://poly.pizza) 转存。署名如下：

| 文件 | 用途 | 作者 | 许可 |
|------|------|------|------|
| `svc_power.glb` | 电厂（Factory） | dook | CC-BY 3.0 |
| `svc_water.glb` | 水厂（Water Tower） | Poly by Google | CC-BY 3.0 |
| `svc_fire.glb` | 消防局（Fire Station） | Ivan | CC-BY 3.0 |
| `svc_police.glb` | 警察局（Police Box） | Daniel | CC-BY 3.0 |
| `svc_health.glb` | 医院（Hospital） | dook | CC-BY 3.0 |
| `svc_education.glb` | 学校（Schoolhouse） | jeremy | CC-BY 3.0 |
| `svc_park.glb` | 公园（Fountain） | Isa | CC-BY 3.0 |
| `svc_garbage.glb` | 垃圾处理（Dumpster） | Jarlan | CC-BY 3.0 |
| `svc_transit.glb` | 公交枢纽（Bus Stop） | Zsky | CC-BY 3.0 |

均来自 Google Poly（archived），CC-BY 3.0，via Poly Pizza。
