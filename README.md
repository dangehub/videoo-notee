# Videoo Notee

📝 视频笔记浏览器扩展 - 边看边记，高效学习

## ✨ 功能特性

- 🎬 **本地视频支持** - 导入本地视频，支持拖拽加载
- 🌐 **主流平台支持** - YouTube、Bilibili 等视频网站
-  **全屏专注模式** - 沉浸式左右分栏笔记体验，支持倍速控制
- 🧩 **悬浮编辑器** - 可拖拽、调整大小的悬浮窗口，随手记录
- 💾 **自动保存** - 停止输入 1 秒后自动保存，防丢失
- 📸 **一键截图** - 快速捕获视频画面，自动生成时间戳链接
- 📝 **Markdown 笔记** - 内置编辑器，支持 Obsidian 语法（[[wikilink]]）
- 💬 **字幕提取** - [开发中] 自动获取视频字幕
- 🤖 **AI 总结** - OpenAI 兼容 API，智能总结视频内容
- 📤 **灵活导出** - 导出为 Markdown 文件，便于整合到笔记库

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发构建

```bash
# Chrome 版本
npm run build:chrome

# Firefox 版本
npm run build:firefox

# 开发模式（监听文件变化）
npm run dev
```

### 加载扩展

**Chrome / Edge:**
1. 下载 Release 页面的 `zip` 包并解压 (或使用 `npm run build:chrome` 生成 `dist/chrome`)
2. 打开 `chrome://extensions/`
3. 启用右上角 "开发者模式"
4. 点击 "加载已解压的扩展程序"
5. 选择解压后的目录

## 📖 使用方法

### 在线视频

1. 打开 YouTube 或 Bilibili 视频页面
2. **悬浮模式**:
   - 点击右下角浮动工具栏（支持拖拽位置）
   - 使用 📸 截图、📝 笔记等功能
3. **全屏专注模式**:
   - 视频全屏播放时，自动启用优化布局
   - 鼠标移至右侧边缘或点击切换按钮呼出编辑器
   - 拖拽分割线调整视频/笔记比例

### 本地视频

1. 点击扩展图标，选择"本地播放器"
2. 拖拽视频文件到播放器
3. （可选）加载 SRT/VTT 字幕文件
4. 使用截图和笔记功能

### 快捷键

| 快捷键 | 功能 |
|-------|------|
| Alt+S | 截图 |
| Alt+N | 添加笔记 |
| Alt+T | 插入时间戳 |
| Ctrl+S | 保存笔记 |

## ⚙️ 配置

### AI 设置

1. 打开编辑器设置
2. 配置 OpenAI 兼容 API:
   - API Endpoint（默认: `https://api.openai.com/v1`）
   - API Key
   - 模型名称（默认: `gpt-4`）

### 导出设置

- **Obsidian 兼容模式** - 使用 `[[wikilink]]` 语法

## 🏗️ 项目结构

```
src/
├── manifest.json       # 扩展配置
├── background/         # Service Worker
├── content/            # 内容脚本
│   └── platforms/      # 平台适配器
├── popup/              # 弹出窗口
├── editor/             # 独立编辑器
├── player/             # 本地播放器
└── lib/                # 公共库
    ├── subtitle/       # 字幕系统
    └── ai/             # AI 功能
```

## 📄 许可

MIT License
