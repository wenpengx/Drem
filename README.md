# Dream

Dream 是一个本地优先的可视化 AI 工作流项目。它把画布编排、模型接口管理、本地文件服务和自动化流程放在一起，适合做图片、视频、文本、分镜和本地文件处理。

## 简介

Dream 的核心是一个节点画布。你可以拖拽节点、连线、生成内容、保存文件，也可以直接调用本地服务处理图片和视频资源。

它同时包含：

- 前端画布工作台
- 本地 Python 服务
- 模型接口配置
- 文件夹循环处理
- 本地缓存和文件保存
- ComfyUI 中间件
- API 自描述接口

## 安装

### 1. 安装前端依赖

```powershell
npm install
```

### 2. 启动前端

```powershell
npm run dev
```

默认会运行在 Vite 提示的地址，通常是 `http://127.0.0.1:5173`

### 3. 创建并启动本地服务虚拟环境

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r localserver\requirements.txt
python -m localserver.dream_server
```

本地服务默认运行在 `http://127.0.0.1:9527`

### 4. 生成生产构建

```powershell
npm run build
```

## 功能

- 画布节点编排
- 图片输入、视频输入、文本节点、预览节点、故事板节点
- 一键工作流模板
  - 文生图工作流
  - 文生图生视频
  - 多角度分镜
  - 绘本草稿
- 节点右键快捷创建
- 文件夹循环处理
  - 选择本地文件夹
  - 扫描图像文件列表
  - 按顺序循环处理
  - 循环结束节点
- 本地文件服务
  - 保存图片、视频
  - 批量保存
  - 本地缓存
  - 删除文件
  - 文件列表读取
- 本地路径选择
  - 用户点击按钮后直接选择保存路径
- API 接口管理
  - 模型配置
  - Provider 配置
  - Key 配置
  - 接口测试
- 本地 API 自描述
  - `/api`
  - `/api/schema`
- ComfyUI 中间件
  - 任务状态
  - 输出读取
  - 工作流应用列表

## 本地服务接口

- `GET /ping`
- `GET /status`
- `GET /config`
- `POST /config`
- `GET /api`
- `GET /api/schema`
- `GET /pick-path`
- `GET /list-files`
- `GET /file/<path>`
- `POST /save`
- `POST /save-batch`
- `POST /save-cache`
- `POST /delete-file`
- `POST /delete-batch`
- `POST /folder-loop/scan`
- `GET /folder-loop/file?scan_id=<id>&index=<n>`
- `GET /proxy`
- `POST /proxy`
- `GET /comfy/apps`
- `POST /comfy/run`
- `GET /comfy/status/<request_id>`
- `GET /comfy/outputs/<request_id>`

## 目录

- `src/` 前端画布和界面
- `localserver/` 本地 Python 服务
- `DreamData/` 本地保存目录

## 说明

- 项目默认使用 `E` 盘工作目录
- 本地服务建议配合 `venv` 使用
- 现有数据会继续保留在本地
