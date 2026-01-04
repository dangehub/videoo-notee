/**
 * 悬浮编辑器组件
 * 在视频网站内嵌一个可拖拽的编辑器窗口
 */

import {
    initFileSystem,
    saveNote as saveNoteToLocal,
    saveScreenshot as saveScreenshotToLocal,
    hasDirectoryAccess,
    getDirectoryName,
    getAssetsFolder
} from '../lib/local-storage.js';
import { checkAndShowDirectoryDialog } from './directory-dialog.js';

// 编辑器状态
let editorInstance = null;
let isVisible = false;
let isDragging = false;
let isResizing = false;
let dragOffset = { x: 0, y: 0 };
let resizeDirection = '';
let currentNoteTitle = '';

// 默认位置和大小
const DEFAULT_CONFIG = {
    width: 420,
    height: 500,
    right: 20,
    top: 80
};

/**
 * 创建悬浮编辑器
 */
export async function createFloatingEditor() {
    if (editorInstance) {
        showEditor();
        return editorInstance;
    }

    // 初始化文件系统
    const hasAccess = await initFileSystem();
    if (!hasAccess) {
        // 显示目录选择对话框
        const selected = await checkAndShowDirectoryDialog();
        if (!selected) {
            console.log('[Videoo Notee] 用户取消选择目录');
            return null;
        }
    }

    // 创建容器
    const container = document.createElement('div');
    container.id = 'videoo-notee-floating-editor';
    container.className = 'vn-floating-editor';

    // 使用 Shadow DOM 隔离样式
    const shadow = container.attachShadow({ mode: 'open' });

    // 注入样式
    const style = document.createElement('style');
    style.textContent = getEditorStyles();
    shadow.appendChild(style);

    // 生成默认笔记标题
    currentNoteTitle = generateNoteTitle();

    // 创建编辑器结构
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'vn-editor-wrapper';
    editorWrapper.innerHTML = `
        <div class="vn-editor-header">
            <div class="vn-drag-handle">
                <span class="vn-logo">📝</span>
                <input type="text" class="vn-note-title" value="${currentNoteTitle}" placeholder="笔记标题">
            </div>
            <div class="vn-header-controls">
                <span class="vn-save-status" title="保存目录">📁 ${getDirectoryName() || '未选择'}</span>
                <button class="vn-btn vn-btn-focus" title="视频模式">🎬</button>
                <button class="vn-btn vn-btn-minimize" title="最小化">─</button>
                <button class="vn-btn vn-btn-close" title="关闭">×</button>
            </div>
        </div>
        <div class="vn-editor-body">
            <div class="vn-toolbar">
                <button class="vn-tool-btn" data-action="screenshot" title="截图 (Ctrl+Shift+S)">📸</button>
                <button class="vn-tool-btn" data-action="timestamp" title="时间戳 (Ctrl+Shift+T)">⏱️</button>
                <button class="vn-tool-btn" data-action="save" title="保存">💾</button>
                <div class="vn-toolbar-spacer"></div>
                <button class="vn-tool-btn" data-action="folder" title="更换保存目录">📂</button>
            </div>
            <div class="vn-note-content">
                <div class="vn-live-editor" contenteditable="true" placeholder="在这里写笔记..."></div>
            </div>
            <div class="vn-screenshots-bar">
                <div class="vn-screenshots-list"></div>
            </div>
        </div>
        <div class="vn-resize-handles">
            <div class="vn-resize-handle vn-resize-n" data-dir="n"></div>
            <div class="vn-resize-handle vn-resize-s" data-dir="s"></div>
            <div class="vn-resize-handle vn-resize-e" data-dir="e"></div>
            <div class="vn-resize-handle vn-resize-w" data-dir="w"></div>
            <div class="vn-resize-handle vn-resize-nw" data-dir="nw"></div>
            <div class="vn-resize-handle vn-resize-ne" data-dir="ne"></div>
            <div class="vn-resize-handle vn-resize-sw" data-dir="sw"></div>
            <div class="vn-resize-handle vn-resize-se" data-dir="se"></div>
        </div>
    `;

    shadow.appendChild(editorWrapper);

    // 设置初始位置
    editorWrapper.style.width = DEFAULT_CONFIG.width + 'px';
    editorWrapper.style.height = DEFAULT_CONFIG.height + 'px';
    editorWrapper.style.right = DEFAULT_CONFIG.right + 'px';
    editorWrapper.style.top = DEFAULT_CONFIG.top + 'px';

    // 绑定事件
    bindEditorEvents(shadow, editorWrapper);

    // 添加到页面
    document.body.appendChild(container);

    editorInstance = {
        container,
        shadow,
        wrapper: editorWrapper,
        liveEditor: shadow.querySelector('.vn-live-editor'),
        screenshotsList: shadow.querySelector('.vn-screenshots-list'),
        screenshots: [],
        content: ''
    };

    isVisible = true;
    return editorInstance;
}

/**
 * 绑定编辑器事件
 */
function bindEditorEvents(shadow, wrapper) {
    const header = shadow.querySelector('.vn-drag-handle');
    const closeBtn = shadow.querySelector('.vn-btn-close');
    const minimizeBtn = shadow.querySelector('.vn-btn-minimize');
    const focusBtn = shadow.querySelector('.vn-btn-focus');
    const resizeHandles = shadow.querySelectorAll('.vn-resize-handle');
    const toolBtns = shadow.querySelectorAll('.vn-tool-btn');

    // 拖拽移动
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = wrapper.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        wrapper.classList.add('vn-dragging');
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            wrapper.style.left = Math.max(0, x) + 'px';
            wrapper.style.top = Math.max(0, y) + 'px';
            wrapper.style.right = 'auto';
        }
        if (isResizing) {
            handleResize(e, wrapper);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        resizeDirection = '';
        wrapper.classList.remove('vn-dragging');
        wrapper.classList.remove('vn-resizing');
    });

    // 调整大小
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeDirection = handle.dataset.dir;
            wrapper.classList.add('vn-resizing');
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // 关闭按钮
    closeBtn.addEventListener('click', hideEditor);

    // 最小化按钮
    minimizeBtn.addEventListener('click', () => {
        wrapper.classList.toggle('vn-minimized');
    });

    // 视频模式按钮
    focusBtn.addEventListener('click', () => {
        // 发送消息进入视频模式
        window.postMessage({ type: 'VN_ENTER_FOCUS_MODE' }, '*');
    });

    // 工具栏按钮
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleToolAction(action);
        });
    });

    // 编辑器内容变化
    const liveEditor = shadow.querySelector('.vn-live-editor');
    liveEditor.addEventListener('input', () => {
        if (editorInstance) {
            editorInstance.content = liveEditor.innerHTML;
            autoSave();
        }
    });

    // 阻止编辑器内的键盘事件冒泡到播放器
    // 这样回车、空格等键不会触发播放器的快捷键
    liveEditor.addEventListener('keydown', (e) => {
        e.stopPropagation();
    });
    liveEditor.addEventListener('keyup', (e) => {
        e.stopPropagation();
    });
    liveEditor.addEventListener('keypress', (e) => {
        e.stopPropagation();
    });

    // 笔记标题变化
    const titleInput = shadow.querySelector('.vn-note-title');
    if (titleInput) {
        titleInput.addEventListener('input', handleTitleChange);
        titleInput.addEventListener('blur', () => {
            if (!titleInput.value.trim()) {
                titleInput.value = generateNoteTitle();
                currentNoteTitle = titleInput.value;
            }
        });
        // 标题输入框也阻止事件冒泡
        titleInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
        titleInput.addEventListener('keyup', (e) => {
            e.stopPropagation();
        });
    }
}

/**
 * 处理调整大小
 */
function handleResize(e, wrapper) {
    const rect = wrapper.getBoundingClientRect();
    const minWidth = 320;
    const minHeight = 300;

    let newWidth = rect.width;
    let newHeight = rect.height;
    let newLeft = rect.left;
    let newTop = rect.top;

    if (resizeDirection.includes('e')) {
        newWidth = Math.max(minWidth, e.clientX - rect.left);
    }
    if (resizeDirection.includes('w')) {
        const diff = rect.left - e.clientX;
        newWidth = Math.max(minWidth, rect.width + diff);
        if (newWidth > minWidth) {
            newLeft = e.clientX;
        }
    }
    if (resizeDirection.includes('s')) {
        newHeight = Math.max(minHeight, e.clientY - rect.top);
    }
    if (resizeDirection.includes('n')) {
        const diff = rect.top - e.clientY;
        newHeight = Math.max(minHeight, rect.height + diff);
        if (newHeight > minHeight) {
            newTop = e.clientY;
        }
    }

    wrapper.style.width = newWidth + 'px';
    wrapper.style.height = newHeight + 'px';
    wrapper.style.left = newLeft + 'px';
    wrapper.style.top = newTop + 'px';
    wrapper.style.right = 'auto';
}

/**
 * 处理工具栏动作
 */
async function handleToolAction(action) {
    switch (action) {
        case 'screenshot':
            // 发送截图请求
            window.postMessage({ type: 'VN_CAPTURE_SCREENSHOT' }, '*');
            break;
        case 'timestamp':
            insertTimestamp();
            break;
        case 'save':
            await saveNoteToFile();
            break;
        case 'folder':
            // 更换保存目录
            await checkAndShowDirectoryDialog();
            updateSaveStatus();
            break;
    }
}

/**
 * 生成时间戳链接
 * @param {string} videoUrl - 视频 URL
 * @param {number} timestamp - 时间戳（秒）
 * @returns {string} 带时间戳的 URL
 */
function generateTimestampUrl(videoUrl, timestamp) {
    try {
        const url = new URL(videoUrl);
        // 使用 ?t= 格式（如果已有参数则使用 &t=）
        url.searchParams.set('t', Math.floor(timestamp).toString());
        return url.toString();
    } catch (e) {
        // 如果 URL 解析失败，使用简单拼接
        const separator = videoUrl.includes('?') ? '&' : '?';
        return `${videoUrl}${separator}t=${Math.floor(timestamp)}`;
    }
}

/**
 * 插入截图到编辑器
 */
export async function insertScreenshot(dataUrl, timestamp, videoUrl) {
    if (!editorInstance) return;

    // 生成截图文件名
    const timeStr = formatTimestamp(timestamp);
    const filename = `screenshot_${Date.now()}`;

    // 保存截图到本地
    let savedPath = filename;
    try {
        savedPath = await saveScreenshotToLocal(dataUrl, filename);
        console.log('[Videoo Notee] 截图已保存:', savedPath);
    } catch (error) {
        console.error('[Videoo Notee] 保存截图失败:', error);
    }

    const screenshot = {
        id: `ss_${Date.now()}`,
        dataUrl,
        savedPath,
        timestamp,
        videoUrl,
        createdAt: Date.now()
    };

    editorInstance.screenshots.push(screenshot);

    // 生成正确的时间戳链接
    const timestampUrl = generateTimestampUrl(videoUrl, timestamp);

    // 在编辑器中插入图片和时间戳（使用相对路径）
    const liveEditor = editorInstance.liveEditor;

    const imgHtml = `
        <div class="vn-screenshot-block" data-path="${savedPath}">
            <img src="${dataUrl}" alt="截图 ${timeStr}" class="vn-screenshot-img" data-saved-path="${savedPath}">
            <a href="${timestampUrl}" class="vn-timestamp-link">${timeStr}</a>
        </div>
    `;

    // 插入到编辑器末尾
    liveEditor.innerHTML += imgHtml;
    liveEditor.scrollTop = liveEditor.scrollHeight;

    // 更新截图缩略图栏
    updateScreenshotsList();

    // 自动保存
    autoSave();
}

/**
 * 更新截图缩略图列表
 */
function updateScreenshotsList() {
    if (!editorInstance) return;

    const list = editorInstance.screenshotsList;
    list.innerHTML = editorInstance.screenshots.map((ss, i) => `
        <img src="${ss.dataUrl}" 
             class="vn-screenshot-thumb" 
             data-index="${i}"
             title="${formatTimestamp(ss.timestamp)}">
    `).join('');
}

/**
 * 插入时间戳
 */
function insertTimestamp() {
    // 请求当前视频时间
    window.postMessage({ type: 'VN_GET_TIMESTAMP' }, '*');
}

/**
 * 自动保存
 */
let saveTimeout = null;
function autoSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveNoteToFile();
    }, 2000);
}

/**
 * 保存笔记到本地文件
 */
async function saveNoteToFile() {
    if (!editorInstance) return;

    try {
        // 转换编辑器内容为 Markdown
        const markdown = htmlToMarkdown(editorInstance.liveEditor);

        // 保存到本地文件
        await saveNoteToLocal(currentNoteTitle, markdown);

        // 更新保存状态显示
        updateSaveStatus('已保存');

        console.log('[Videoo Notee] 笔记已保存:', currentNoteTitle);
    } catch (error) {
        console.error('[Videoo Notee] 保存笔记失败:', error);
        updateSaveStatus('保存失败');
    }
}

/**
 * 显示编辑器
 */
export function showEditor() {
    if (!editorInstance) {
        createFloatingEditor();
        return;
    }
    editorInstance.container.style.display = 'block';
    isVisible = true;
}

/**
 * 隐藏编辑器
 */
export function hideEditor() {
    if (!editorInstance) return;
    editorInstance.container.style.display = 'none';
    isVisible = false;
}

/**
 * 切换编辑器显示
 */
export function toggleEditor() {
    if (isVisible) {
        hideEditor();
    } else {
        showEditor();
    }
}

/**
 * 格式化时间戳
 */
function formatTimestamp(seconds) {
    if (!seconds && seconds !== 0) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * 生成笔记标题
 */
function generateNoteTitle() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const title = document.title || 'Untitled';
    // 清理标题中的特殊字符
    const cleanTitle = title
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100);
    return `${dateStr} ${cleanTitle}`;
}

/**
 * 更新保存状态显示
 */
function updateSaveStatus(status) {
    if (!editorInstance) return;

    const statusEl = editorInstance.shadow.querySelector('.vn-save-status');
    if (statusEl) {
        if (status) {
            statusEl.textContent = `✓ ${status}`;
            statusEl.classList.add('saved');
            setTimeout(() => {
                statusEl.textContent = `📁 ${getDirectoryName() || '未选择'}`;
                statusEl.classList.remove('saved');
            }, 2000);
        } else {
            statusEl.textContent = `📁 ${getDirectoryName() || '未选择'}`;
        }
    }
}

/**
 * HTML 转 Markdown
 */
function htmlToMarkdown(element) {
    let markdown = '';

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const tag = node.tagName.toLowerCase();
        let content = '';

        // 递归处理子节点
        for (const child of node.childNodes) {
            content += processNode(child);
        }

        switch (tag) {
            case 'div':
                if (node.classList.contains('vn-screenshot-block')) {
                    // 截图块：转换为 Markdown 图片格式
                    const img = node.querySelector('img');
                    const link = node.querySelector('.vn-timestamp-link');
                    const savedPath = img?.dataset.savedPath || img?.src || '';
                    const timestamp = link?.textContent || '';
                    const href = link?.href || '';

                    let result = `![截图 ${timestamp}](${savedPath})\n`;
                    if (href) {
                        result += `[${timestamp}](${href})\n`;
                    }
                    return result + '\n';
                }
                return content + '\n';

            case 'p':
                return content + '\n\n';

            case 'br':
                return '\n';

            case 'strong':
            case 'b':
                return `**${content}**`;

            case 'em':
            case 'i':
                return `*${content}*`;

            case 'a':
                const href = node.getAttribute('href');
                return `[${content}](${href})`;

            case 'img':
                const src = node.dataset.savedPath || node.src;
                const alt = node.alt || '图片';
                return `![${alt}](${src})`;

            case 'h1':
                return `# ${content}\n\n`;
            case 'h2':
                return `## ${content}\n\n`;
            case 'h3':
                return `### ${content}\n\n`;

            case 'ul':
                return content + '\n';
            case 'ol':
                return content + '\n';
            case 'li':
                return `- ${content}\n`;

            case 'code':
                return `\`${content}\``;

            case 'pre':
                return `\`\`\`\n${content}\n\`\`\`\n`;

            default:
                return content;
        }
    }

    markdown = processNode(element);

    // 清理多余的空行
    return markdown
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * 处理笔记标题变化
 */
function handleTitleChange(event) {
    currentNoteTitle = event.target.value || generateNoteTitle();
}

/**
 * 获取编辑器样式
 */
function getEditorStyles() {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .vn-editor-wrapper {
            position: fixed;
            background: #1e1e2e;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #cdd6f4;
            overflow: hidden;
            transition: box-shadow 0.2s;
        }

        .vn-editor-wrapper:hover {
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
        }

        .vn-editor-wrapper.vn-dragging {
            opacity: 0.9;
            cursor: grabbing;
        }

        .vn-editor-wrapper.vn-minimized .vn-editor-body {
            display: none;
        }

        .vn-editor-wrapper.vn-minimized {
            height: auto !important;
        }

        /* Header */
        .vn-editor-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: #181825;
            border-bottom: 1px solid #313244;
            cursor: grab;
        }

        .vn-drag-handle {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }

        .vn-logo {
            font-size: 18px;
        }

        .vn-title {
            font-size: 14px;
            font-weight: 600;
            color: #cba6f7;
        }

        .vn-note-title {
            flex: 1;
            background: transparent;
            border: none;
            color: #cba6f7;
            font-size: 14px;
            font-weight: 600;
            outline: none;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
        }

        .vn-note-title:hover,
        .vn-note-title:focus {
            background: #313244;
        }

        .vn-note-title::placeholder {
            color: #6c7086;
        }

        .vn-save-status {
            font-size: 12px;
            color: #6c7086;
            padding: 4px 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        }

        .vn-save-status.saved {
            color: #a6e3a1;
        }

        .vn-header-controls {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .vn-btn {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            color: #6c7086;
            font-size: 16px;
            cursor: pointer;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .vn-btn:hover {
            background: #313244;
            color: #cdd6f4;
        }

        .vn-btn-close:hover {
            background: #f38ba8;
            color: #1e1e2e;
        }

        .vn-btn-focus:hover {
            background: #89b4fa;
            color: #1e1e2e;
        }

        /* Body */
        .vn-editor-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        /* Toolbar */
        .vn-toolbar {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            gap: 4px;
            background: #1e1e2e;
            border-bottom: 1px solid #313244;
        }

        .vn-tool-btn {
            padding: 6px 10px;
            border: none;
            background: #313244;
            color: #cdd6f4;
            font-size: 14px;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .vn-tool-btn:hover {
            background: #45475a;
        }

        .vn-toolbar-spacer {
            flex: 1;
        }

        /* Note Content */
        .vn-note-content {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .vn-live-editor {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.7;
            outline: none;
            min-height: 200px;
        }

        .vn-live-editor:empty::before {
            content: attr(placeholder);
            color: #6c7086;
        }

        .vn-live-editor img {
            max-width: 100%;
            border-radius: 8px;
            margin: 8px 0;
        }

        .vn-screenshot-block {
            margin: 12px 0;
        }

        .vn-screenshot-img {
            max-width: 100%;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .vn-screenshot-img:hover {
            transform: scale(1.02);
        }

        .vn-timestamp-link {
            display: inline-block;
            margin-top: 4px;
            color: #89b4fa;
            text-decoration: none;
            font-size: 13px;
        }

        .vn-timestamp-link:hover {
            text-decoration: underline;
        }

        /* Screenshots Bar */
        .vn-screenshots-bar {
            padding: 8px 12px;
            background: #181825;
            border-top: 1px solid #313244;
            min-height: 60px;
        }

        .vn-screenshots-list {
            display: flex;
            gap: 8px;
            overflow-x: auto;
        }

        .vn-screenshot-thumb {
            width: 80px;
            height: 45px;
            border-radius: 4px;
            object-fit: cover;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
        }

        .vn-screenshot-thumb:hover {
            border-color: #89b4fa;
            transform: scale(1.05);
        }

        /* Resize Handles */
        .vn-resize-handles {
            position: absolute;
            inset: 0;
            pointer-events: none;
        }

        .vn-resize-handle {
            position: absolute;
            pointer-events: auto;
        }

        .vn-resize-n, .vn-resize-s {
            left: 8px;
            right: 8px;
            height: 6px;
            cursor: ns-resize;
        }

        .vn-resize-n { top: -3px; }
        .vn-resize-s { bottom: -3px; }

        .vn-resize-e, .vn-resize-w {
            top: 8px;
            bottom: 8px;
            width: 6px;
            cursor: ew-resize;
        }

        .vn-resize-e { right: -3px; }
        .vn-resize-w { left: -3px; }

        .vn-resize-nw, .vn-resize-ne, .vn-resize-sw, .vn-resize-se {
            width: 12px;
            height: 12px;
        }

        .vn-resize-nw { top: -3px; left: -3px; cursor: nwse-resize; }
        .vn-resize-ne { top: -3px; right: -3px; cursor: nesw-resize; }
        .vn-resize-sw { bottom: -3px; left: -3px; cursor: nesw-resize; }
        .vn-resize-se { bottom: -3px; right: -3px; cursor: nwse-resize; }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: #45475a;
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #585b70;
        }
    `;
}

export default {
    createFloatingEditor,
    showEditor,
    hideEditor,
    toggleEditor,
    insertScreenshot
};
