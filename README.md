# 王恩涛｜视效知识库

基于 React + Vite 的 AE 与 Blender 视效制作知识库。当前包含 106 条记录，支持检索、平台与分类筛选、多图案例详情和原图放大。

`public/assets/knowledge` 与 `public/assets/blender` 保存了从原始 Notion 页面整理的案例图，网站部署后不依赖 Notion 的临时图片地址。Blender 内容分为“运算与矢量”和“噪波基础”。

## 本地运行

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

仓库包含 GitHub Pages 工作流。将 Pages 的发布来源设为 GitHub Actions，推送到 `main` 分支后即可自动部署。
