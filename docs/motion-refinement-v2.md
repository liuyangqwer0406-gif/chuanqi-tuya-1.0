# 作品集交互预览 v2 · 2026-09-14

独立预览：`D:/codex/CODEX 2/previews/portfolio-motion-v2`

基于 `D:/codex/CODEX 2/chuanqi-tuya-motion` 的当前工作区副本，包含此前未提交的修改。原目录保留；本轮没有暂存、提交、推送或部署。依赖目录通过 junction 复用，源文件和构建目录独立。本轮修改前的四个源文件另存于 `output/baseline/`。

## 参考与取舍

- [Niccolò Miranda](https://www.niccolomiranda.com/)：访问原站并查看渲染；借鉴横向作品浏览与明确的图片入口，将其用于手机项目索引和封面切换。
- [Any Given Moment](https://www.anygivenmoment.co/)：原站可访问，查看了入口画面；拨盘交互的描述来自 [HOVERSTAT](https://www.hoverstat.es/)。本预览将逐件浏览的想法简化为项目计数及前后按钮，并未复刻其拨盘。
- [MUDA](https://muda.co/)：访问原站并查看页面；HOVERSTAT 描述其滚动响应导航。本预览采用更克制的当前区域指示和链接下划线。

保留黑底、纸白、橙色、细字和原有 3D 首屏。参考交互机制，不复制参考站的代码、图片、品牌或版式。

## 本轮变化

1. 项目索引加入真实封面缩略图；手机改为横向滚动，当前项目自动滚入可视区域。
2. 新增前后按钮与 01 / 07 项目计数；可循环浏览，状态通过 polite live region 提示。
3. 封面可直接打开案例，手机横向滑动换项目，纵向滚动和双指缩放保留；滑动后抑制误点击。
4. 图片约 0.48 秒横移淡入，文案延迟进入；快速切换会结束旧动画，不堆叠残影。
5. 修正点击项目时焦点事件抢先执行，导致动画被跳过的问题；键盘聚焦即时切换。
6. 导航增加当前作品区域提示、链接下划线和按钮反馈。
7. 修正自定义光标滚动后标签过期；键盘操作时隐藏鼠标提示。
8. 运行中开启减少动态效果会结束正在进行的项目切换。

## 验证与复现

- 最终正式构建：22 个静态页面通过，TypeScript 通过；本轮四个 TSX 文件 ESLint 通过。
- `audit-refinement.mjs`：PASS。1440 / 1024 / 768 / 390 / 320px，快速切换后单一图片与文案、键盘 Home/End、缩略图实际高度、运行中减少动态效果、页面无横向溢出。
- Chromium touch input：横向滑动切换后停留首页，随后轻点打开 `/synthesis/projects/melonpop/`；PASS。
- `audit-motion.mjs`：PASS。既有章节导航、图库焦点恢复、离屏暂停、手机和减少动态效果回归通过；作品区停止操作后主页面与背景的 RAF 采样均为 0。此回归在最后的缩略图高度与光标小修之前执行，最终修订另由新增交互检查和导出检查覆盖。
- 最终 `audit-export.mjs`：PASS。22 个 HTML 页面、683 处本地资源引用；浏览器访问首页、About 和 7 个项目页，75 张页面图片解码成功，无运行错误或失败资源。
- 视觉复查：最终桌面、手机截图已查看，手机缩略图有实际图像；证据为 `output/qa/refinement-desktop.png` 和 `refinement-mobile.png`。

在此目录运行：

```powershell
npm.cmd run build
python -m http.server 4330 --bind 127.0.0.1 --directory out
```

另开终端：

```powershell
$env:PLAYWRIGHT_PATH='D:\codex\CODEX 2\.tmp\motion-v2-tools\node_modules\playwright'
$env:AUDIT_ORIGIN='http://127.0.0.1:4330'
node scripts/audit-refinement.mjs
node scripts/audit-motion.mjs
node scripts/audit-export.mjs
```

浏览器证据保存在 `output/qa/`。触控验证使用 Chromium 的 touch input 模拟，不等同于真机手感测试。浏览器检查和构建不代表线上网速测试。

本轮供审阅的实现文件：`synthesis-home.tsx`、`synthesis-shell.tsx`、`instrument-cursor.tsx`、`synthesis/layout.tsx`，以及新增 `motion-refinement.css`。正式整合前需确认预览。
