# UI、布局与排版检查 · 2026-09-20

目标：检查当前 v4 预览中首屏以外的作品、设计能力、关于页和项目详情，修正裁切、标题换行、正文列宽与矮屏布局问题。

预览：http://127.0.0.1:4333/synthesis/

## 问题与修正

| 区域 | 浏览器中确认的问题 | 修正 |
| --- | --- | --- |
| 关于页首屏 | 320px 下标题撑大 Grid 内容列，标题和侧栏文字被外层 overflow 裁切；桌面标题也出现过多碎行 | 单列使用 minmax(0, 1fr)，子项允许收缩；按可用宽度减小标题字号并增加行高 |
| 关于页经历 | 320px 下 LEARNING 超出标题边界；中英文栏目标签被拆成短行 | 调整移动端字号；标签按完整短语换行；缩小栏目上下留白 |
| 关于页个人介绍 | 双栏中的正文再分两列，平板下行长过短；标题前后的固定留白偏大 | 中英文正文顺序排列，限制阅读行长，使用响应式间距和标题字号 |
| 首页关于区域 | 平板下双语正文列宽过窄 | 1100px 以下改为单列正文 |
| 作品与项目详情 | 多行英文标题行高紧，项目总结在窄屏产生较多碎行 | 局部调整字号、字距及行高；作品中文说明调整到 14px、1.8 行高 |
| 设计能力 | 矮屏固定最小高度使导航无法同时容纳；小屏标题拆行过多 | 高度不超过 680px 时顺序展开；缩小移动端标题；正文 14px |
| 关于页设计方法 | 手机固定舞台里大标题、图片和底部文案争用空间 | 手机及矮屏改为正常文档流展示；相同断点停止写入飞入动画的行内样式 |
| 设计能力章节导航 | 展开布局中高亮可能提前跳到下一章；桌面矮屏锚点定位受到滚动引擎位置状态影响 | 按接近顶部的阅读位置判断当前章；点击时计算真实文档坐标后滚动 |

## 修改范围

- `src/app/synthesis/synthesis.css`
- `src/app/synthesis/evolution-motion.css`
- `src/components/synthesis/synthesis-about-page.module.css`
- `src/components/synthesis/synthesis-about-page.tsx`
- `src/components/synthesis/evolution-story.tsx`
- `scripts/audit-layout.mjs`

植物/粒子实现与项目正文没有改写。采用原有样式与 React 组件，没有新增依赖。

## 验证与证据

截图和本轮备份位于 `output/layout-review/`。`before-*.png` 与 `after-*.png` 可按同名区域比较；类型脚本备份使用 `.bak` 后缀，避免被 TypeScript 当作应用源文件编译。

布局脚本检查首页、关于页在 1440×900、1024×768、900×700、768×1024、390×844、320×700、1366×600 下的布局，并对七个项目在 1440/900/320px 下检查文本边界。记录文件为 `output/layout-review/layout-audit.json`。

已有交互和静态资源复验分别记录在 `output/qa/motion-audit.json` 与 `output/qa/export-audit.json`。手机验证使用 Edge 浏览器模拟，不代表实体 iOS/Safari 检查。

最终结果：构建、TypeScript、两份修改 TSX 的 ESLint 通过。布局审计覆盖 35 个页面/尺寸组合，结果 PASS；交互和导出资源审计均 PASS，无运行错误或失败资源。导出检查包含 22 页、683 处本地引用及 75 张解码图片。额外的实时窗口缩放与减少动态效果切换检查也通过，记录在 `output/layout-review/resize-audit.json`。最终关于页首屏与手机方法区截图为 `final-about-desktop.png` 和 `final-about-method-mobile.png`。

复现：

```powershell
npm.cmd run build
$env:PLAYWRIGHT_PATH='D:\codex\CODEX 2\.tmp\motion-v2-tools\node_modules\playwright'
$env:AUDIT_ORIGIN='http://127.0.0.1:4333'
node scripts/audit-layout.mjs
node scripts/audit-motion.mjs
node scripts/audit-export.mjs
```
