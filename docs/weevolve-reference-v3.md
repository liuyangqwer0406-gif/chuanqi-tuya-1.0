# WeEvolveIT 参考预览 v3 · 2026-09-14

独立目录：`D:/codex/CODEX 2/previews/portfolio-motion-v3`

预览首页：<http://127.0.0.1:4332/synthesis/>

能力章节：<http://127.0.0.1:4332/synthesis/#practice>

## 参考证据

用户参考：[WeEvolveIT](https://weevolveit.com/es)。在实际浏览器中访问，看到粒子地球、黑白场景切换、随滚动变化的章节内容与形态、大标题、固定导航和进度显示。文本抓取接口首次访问 `/es` 未返回内容，随后使用 Edge 浏览器取得真实页面，并以主页文本交叉核对。

原站截图与页面记录保存在 `output/reference-weevolve/`。它們是设计参考，不是实现指令。没有复制原站代码、地图数据、标志、图片或商业宣传文案。

用户明确选择三个方向全部加强：粒子变化与滚动叙事、首屏三维视觉与鼠标响应、黑白切换与大标题动效。

## 本轮实现

- 首屏替换为原创粒子形体：球体随鼠标旋转，随滚动向体积形状过渡；标题分行进入并随滚动轻移淡出。
- 首屏增加直达设计能力的入口，保留作品入口。
- 原能力卡片改成纸白色三章节叙事：品牌与包装、三维与空间、网页与原型。使用现有能力文案。
- 粒子以球体、瓶状体积、三层界面框架依次变化，章节间变形、章节中段保持清晰形态。
- 桌面采用 sticky 舞台和可点击章节导航；手机连续展开内容；减少动态效果模式停止固定叙事并显示全部章节。
- 黑色作品区域过渡到纸白能力区域，以阶梯式切口衔接；保留橙色识别、轻字重和细线。
- v2 的缩略图、滑动换项目、前后按钮、图库和案例导航保持可用。

技术上，粒子采用三维坐标旋转和透视投影，用 Canvas 2D 绘制，不是新增 WebGL 场景。没有新增运行时依赖。仅在滚动、指针输入或尺寸变化时申请帧，停止操作和离屏后不持续绘制。原首屏仍保留在 v2，可对照。

## 验证

- 正式构建生成 22 个静态页面，TypeScript 通过；本轮 TSX 文件 ESLint 通过。
- `audit-evolution.mjs` 检查真实像素变化、三个章节的不同形态、鼠标与键盘跳转、停止操作后的绘制计数、减少动态效果、跨页返回及响应式布局。
- `audit-refinement.mjs`：PASS；v2 快速切换、触控滑动、点击导航及五档布局回归通过。
- `audit-export.mjs`：PASS；22 页、683 处引用，浏览器访问主页、About 与 7 个项目，75 张图片解码成功，无运行错误和失败资源。
- `audit-motion.mjs`：PASS；原有图库、章节导航与转场回归通过，首页及作品区域停止操作后的主页面 RAF 采样为 0。该次执行在最终形态停留时段微调之前，最终粒子变化另由 evolution 检查覆盖。
- 已查看实际桌面首屏、三个章节及手机截图。触控检查使用浏览器模拟，不是实体手机测试。

具体最终结果见 `output/qa/*report.json`。

## 运行

```powershell
npm.cmd run build
python -m http.server 4332 --bind 127.0.0.1 --directory out
```

另开终端：

```powershell
$env:PLAYWRIGHT_PATH='D:\codex\CODEX 2\.tmp\motion-v2-tools\node_modules\playwright'
$env:AUDIT_ORIGIN='http://127.0.0.1:4332'
node scripts/audit-evolution.mjs
node scripts/audit-refinement.mjs
node scripts/audit-export.mjs
```

v3 是基于 v2 的独立源代码副本，构建目录独立，依赖通过 junction 复用。v2 和原始 `chuanqi-tuya-motion` 均保留，未暂存、提交、推送或部署。等待用户查看预览后决定正式整合。
