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
npm run start
```

## Netlify

仓库根目录已经包含 `netlify.toml`：

- Build command: `npm run build`
- Publish directory: `.next`
- Production branch: `main`

在 Netlify 中直接连接本仓库即可，不需要设置子目录。
