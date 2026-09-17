# 王恩涛｜视效知识库

基于 React + Vite 的 AE 与 Blender 视效制作知识库。当前包含 106 条记录，支持检索、平台与分类筛选、多图案例详情和原图放大，并附带 RGBA 通道工作台。

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

扩展工具在同一个工作台内提供“合并 / 拆分”切换：

- “RGBA 合并”在浏览器本地读取四个通道贴图，按亮度写入 R/G/B/A，支持透明棋盘预览、自定义 PNG 文件名和下载。
- “RGBA 拆分”从合并贴图直接提取四个通道，支持逐通道自定义语义、“无 / 不使用”、自定义快捷映射、自动命名和单张或批量下载。自定义快捷映射保存在浏览器本地；拆分结果可一键带入合并模式，停用通道会被自动跳过。
