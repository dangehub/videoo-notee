# Videoo Notee

📝 视频笔记浏览器扩展 - 边看边记，高效学习

## ✨ 功能特性

- 🎬 **本地视频支持** - 导入本地视频，支持拖拽加载
- 🌐 **主流平台支持** - YouTube、Bilibili 等视频网站
- 📸 **一键截图** - 快速捕获视频画面，自动生成时间戳链接
- 📝 **Markdown 笔记** - 内置编辑器，支持 Obsidian 语法（[[wikilink]]）
- 💬 **字幕提取** - 自动获取视频字幕，支持本地 SRT/VTT 导入
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

**Chrome:**
1. 打开 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `dist/chrome` 目录

**Firefox:**
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击"临时载入附加组件"
3. 选择 `dist/firefox/manifest.json`

## 📖 使用方法

### 在线视频

1. 打开 YouTube 或 Bilibili 视频页面
2. 点击右下角浮动工具栏的按钮：
   - 📸 截图 - 捕获当前画面
   - 📝 笔记 - 打开侧边栏添加笔记
   - 💬 字幕 - 获取视频字幕
   - 📋 侧边栏 - 打开完整编辑器

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
