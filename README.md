# Wen Yifan Portfolio

温一帆的视觉设计作品集，聚焦品牌设计、包装设计、三维影像与交互体验。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。根地址会自动进入正式作品集 `/synthesis`。

## 生产构建

```bash
npm run build
```

本项目使用静态导出，部署目录是 `out`，不使用 `next start`。已安装 Python 时可运行
`python -m http.server 4173 --directory out`，然后打开 `http://localhost:4173/synthesis/`。

构建会自动生成响应式 WebP，并补齐 Windows 上 Next 16.3.2 的预加载文件名。
Cloudflare Pages 使用构建命令 `npm run build`、输出目录 `out`。
动效、性能改动与验证方法见 [验证记录](docs/motion-performance.md)。

## Netlify（既有配置）

仓库根目录已经包含 `netlify.toml`：

- Build command: `npm run build`
- Publish directory: `.next`
- Production branch: `main`

这是仓库原有的 Next 插件配置，本次未验证 Netlify 部署。当前 `output: "export"` 的纯静态产物是 `out`；不要将这里的 `.next` 配置用于 Cloudflare Pages。
