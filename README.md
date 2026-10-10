# 王恩涛｜视效知识库

基于 React + Vite 的 AE、Blender 与 Unreal Engine 视效制作知识库。当前包含 378 条记录、32 个分类（AE 90 条、Blender 几何节点 16 条、Blender 材质节点 112 条、UE 160 条），支持检索、平台与分类筛选、多图案例详情和原图放大，并附带 RGBA 通道工作台。Blender 几何节点与材质节点提供独立的平台入口、分类和搜索范围。

`public/assets/knowledge` 与 `public/assets/blender` 保存了从原始 Notion 页面整理的案例图，网站部署后不依赖 Notion 的临时图片地址。Blender 内容包含原有的几何节点笔记，以及 12 类、112 条着色器节点速查。着色器说明整理自 [Blender 官方手册](https://docs.blender.org/manual/en/5.1/render/shader_nodes/index.html)，原文及改写内容遵循 [CC BY-SA 4.0](https://docs.blender.org/manual/en/5.1/about/license.html)。

UE 材质节点从本地 `UE56-Material-Guide` 整理，完整保留 12 类节点的英文名、中文释义、用途、例子、注意事项和逐条官方文档来源；包含 17 个轻量原理示意。提供常用节点、收藏、复制英文名和关联节点跳转。收藏保存在当前浏览器中。中文名称为易懂释义，不代表官方本地化名称，收录范围不包含全部插件、Substrate 或所有材质函数。

UE 内容位于 `src/data/ue-material-guide.json`，无需源指南目录即可独立运行和部署。更新原指南后可在项目目录运行 `node scripts/import-ue-materials.mjs "源指南文件夹路径"` 再重新构建。

## 本地运行

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址；追加 `?platform=ue` 可直接预览 Unreal Engine 材质库，`?platform=blender-geometry` 进入 Blender 几何节点，`?platform=blender-material` 进入 Blender 材质节点。旧的 `?platform=blender` 地址兼容进入几何节点。首页保持全部平台入口。目录每批展示 24 条，搜索检索当前平台全部数据；仅已打开的详情绘制 Canvas 示意图，没有新增 WebGL 背景或外部图片依赖。

## 构建

```bash
pnpm build
```

仓库包含 GitHub Pages 工作流。将 Pages 的发布来源设为 GitHub Actions，推送到 `main` 分支后即可自动部署。

扩展工具在同一个工作台内提供“合并 / 拆分”切换：

- “RGBA 合并”在浏览器本地读取四个通道贴图，按亮度写入 R/G/B/A，支持 PNG、JPG、WEBP 和常见 16/24/32 位 TGA（含 RLE）贴图、透明棋盘预览、自定义 PNG 文件名和下载。
- “RGBA 拆分”从合并贴图直接提取四个通道，支持 R/G/B/A 大图切换预览、Base Color 参考图对照、TGA 参考图读取、逐通道自定义语义、“无 / 不使用”、自定义快捷映射、自动命名和单张或批量下载。自定义快捷映射保存在浏览器本地；拆分结果可一键带入合并模式，停用通道会被自动跳过。
