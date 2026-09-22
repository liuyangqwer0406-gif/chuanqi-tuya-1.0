# 植物与粒子融合 · v4

用户要求：将原 Hero 的植物与当前粒子视觉有机融合。

预览：<http://127.0.0.1:4333/synthesis/>

本轮基于 v3 创建独立目录，v2、v3、原始项目均保留，没有提交、推送或部署。

## 视觉和交互

- 恢复原 black-ember 的枝干、苔藓、蕨类、花朵和原有生物动态。
- 粒子加入植物自身的 Three.js scene，与植物共用 camera、renderer、depth buffer 及 clock。首屏移除 v3 的独立 Canvas 2D 粒子球。
- 粒子开启深度测试，前景植物可遮挡后方粒子；聚合轮廓位于画面上方。
- 全部融合粒子的起点采样原植物表面，首屏保持附着和轻微漂浮。滚动时按粒子错开的时间释放，沿三次曲线路径向聚合轮廓汇集；反向滚动可返回。
- 路径叠加共享的三角函数空间流场，让邻近粒子产生连续的漂动。此处是自写的轻量实现，借鉴 Flow Field 的运动思路，没有直接使用它的 Canvas 2D 渲染器或声称移植了 Simplex 算法。
- 聚合轮廓通过空间扰动及透明度变化形成不规则的疏密和缺口，保留少量连接植物的粒子。鼠标在局部范围内推开粒子，离开后平滑恢复。
- 滚动淡出只影响首屏标题与上方标签，作品按钮和说明保持清晰。
- 纸白与橙色粒子沿用植物的暖色光照方向。v3 的首屏文字入场和下方纸白滚动叙事保留。
- 桌面 2200 个粒子，原场景窄屏模式使用 1100 个粒子。粒子路径由顶点着色器计算，活动场景跟随显示刷新率；离屏停止循环，减少动态效果模式呈现静态植物与粒子。

## 实现范围

- `src/components/synthesis/plant-particle-hero.tsx`：首屏可见性、滚动进度及场景通信。
- `src/shaders/sylva-living-world/sources/plant-particle-fusion.js`：采样植物表面、粒子几何及统一场景绘制。
- `SylvaLivingWorldScene.tsx`：增加仅此预览使用的 plantParticles 入口和场景注入；复用现有渲染生命周期。
- `synthesis-shell.tsx`、`evolution-motion.css`：接入融合首屏。

## 验证

- 构建：22 个静态页面及 TypeScript 通过。
- 本轮 TSX 文件 ESLint 通过。
- 新增 `scripts/audit-fusion.mjs`，检查真实场景状态、粒子数量、相机响应、滚动进度、渲染频率、离屏暂停与恢复、减少动态效果及 1440/1024/768/390/320px 布局。
- `scripts/audit-motion.mjs` 复验原有作品切换、章节导航、图库焦点、页面转场、手机与减少动态效果；结果 PASS。作品区停稳后所有被采样 frame 的 RAF 计数为 0。
- `scripts/audit-export.mjs` 检查 22 页、683 处本地引用及 75 张页面图片，无资源失败或运行错误。此检查在最后仅调整暂停边界前执行；最终边界行为由 fusion 和 motion 检查覆盖。
- 结果与截图位于 `output/qa/`。浏览器手机模拟不是实体手机测试。

## 复现

```powershell
npm.cmd run build
python -m http.server 4333 --bind 127.0.0.1 --directory out
```

另开终端：

```powershell
$env:PLAYWRIGHT_PATH='D:\codex\CODEX 2\.tmp\motion-v2-tools\node_modules\playwright'
$env:AUDIT_ORIGIN='http://127.0.0.1:4333'
node scripts/audit-fusion.mjs
node scripts/audit-motion.mjs
node scripts/audit-export.mjs
```

## 2026-09-20 流动路径修订

用户批准按 ThreeUI 研究方向继续改动，本次直接更新已有 v4 独立预览。原版粒子、场景适配文件、CSS 与审计脚本备份在 `output/before-flow-refinement/`。

源码变更仅涉及 `plant-particle-fusion.js`、`SylvaLivingWorldScene.tsx` 的 dt 传递，以及 `evolution-motion.css` 的标题淡出范围。未添加运行时依赖。原植物几何、作品内容和下方章节沿用现有版本。

审计脚本补充了初始附着、逐步释放、聚合、反向返回、局部鼠标排斥、按钮可见性及手机聚合状态的行为检查。最新结果以 `output/qa/fusion-report.json`、`motion-audit.json` 和 `export-audit.json` 为准。

本次最终验证：构建及 TypeScript 通过；修改的 TSX 文件 ESLint 与粒子脚本语法检查通过；fusion、motion、export 三项审计均 PASS。fusion 覆盖 1440/1024/768/390/320px、离屏暂停和动态切换减少动态效果。桌面 1100ms 内记录 31 次渲染（约 28fps，属于本机采样，不是跨设备性能保证）。export 重新检查 22 页、683 处本地引用及 75 张解码图片；未记录运行错误或失败资源。桌面初始/释放/聚合与手机初始/聚合截图已人工查看。

参考研究：`../../../.tmp/threeui-research/recommendations.md`。本次改动没有复制新的第三方源文件。

## 2026-09-22 Hero 60fps 预览

移除宿主循环的 30fps 阈值，活动且可见的场景现在每次 `requestAnimationFrame` 绘制。粒子运动从逐粒子 JavaScript 计算和动态缓冲上传改为静态属性加顶点着色器，保留原有路径、疏密、深度测试、指针推力及滚动往返。iframe 指针坐标换算改用缓存尺寸，移动事件不再触发布局读取。

`scripts/audit-hero-60fps.mjs` 在 1440×900、1024×768、390×844 下持续驱动指针和滚动，并检查平均帧率、p95 帧间隔、长任务、离屏暂停、恢复、减少动态效果与资源错误。本机无头浏览器以约 165Hz 运行，三档平均约 165fps，p95 约 6.2ms，未记录 50ms 以上长任务；这表示渲染随测试环境刷新率运行，不代表所有设备都固定达到 165fps。
