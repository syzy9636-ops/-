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

## 四方连续贴图工作台

从侧栏「扩展工具 → 四方连续贴图」进入，或访问 `?tool=seamless`。工作台使用网站配色，提供导入、多素材管理、裁切、四边无缝、局部选区、AI／纹理修复笔刷、橡皮擦、原图与结果对比、2×2／3×3 平铺、固定巡检、撤销／重做、自定义名称和分辨率、批量处理及导出。支持 TGA、TIFF、PNG 等导入，以及 PNG、TIFF、TGA、BMP、WebP、JPEG 六种导出格式。输出为正方形，非方形按正方形选区或居中裁切。

图片在浏览器本地处理，无需运行 EXE 或后端服务。首次进入工作台只加载界面和普通处理代码；首次使用 AI 时加载约 210 MB 的模型与推理运行文件，后续优先使用浏览器缓存。AI 在独立 Worker 中运行，支持取消；GitHub Pages 使用单线程 WASM，无需额外响应头。普通纹理修复不加载 AI 模型。AI 会推测缺失内容，不能保证还原原图。默认下载到浏览器下载目录；支持文件夹选择的浏览器也可授权选择保存文件夹。

同一页面中返回知识库再进入工作台会保留素材与编辑。刷新或关闭网页不会恢复会话，请先导出结果。为了留出编辑空间，工作台暂时收起网站侧栏，左上角菜单仍可打开。换肤与桌面窗口置顶不包含在网页版，使用网站统一主题与全屏按钮。

未选择保存文件夹时，批量导出会下载一个 ZIP 包，内含每张贴图；重名文件自动编号。单个下载包最多容纳 256 MiB 的贴图，大批量请分批导出，或在支持的浏览器中选择保存文件夹后直接输出。部分素材失败时会显示成功／失败数量，并在下载包有空间时加入错误报告。选文件夹不是使用批量导出的前提。

`public/tools/seamless/ai/` 必须完整上传。模型拆为 13 个不超过 16 MiB 的 `.bin` 文件，已校验与原始 ONNX 模型完全一致，不使用 Git LFS；浏览器按清单拼接和校验。保留该目录的模型、运行库和第三方许可。原始实现来自本地 Seamless-Studio；网页适配后的源码在 `public/tools/seamless/`。

验证核心算法与模型文件：`node scripts/verify-seamless.mjs`。构建后使用 `node scripts/preview-pages.mjs` 可在 `http://127.0.0.1:5184/knowledge-preview/?tool=seamless` 检查仓库子路径部署。
