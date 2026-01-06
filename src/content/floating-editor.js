/**
 * 悬浮编辑器组件
 * 在视频网站内嵌一个可拖拽的编辑器窗口
 */

import {
    initFileSystem,
    saveNote as saveNoteToLocal,
    saveScreenshot as saveScreenshotToLocal,
    readNote,
    readResource,
    hasDirectoryAccess,
    getDirectoryName,
    getAssetsFolder
} from '../lib/local-storage.js';
import { checkAndShowDirectoryDialog } from './directory-dialog.js';
import { showFileListDialog } from './file-list-dialog.js';
import { extractPropertiesAsArray, propertiesToFrontmatter } from '../utils/clipper-bridge.js';
import { parseFrontmatter, markdownToHtml, htmlToMarkdown, renderPropertiesList, initPropertiesSection, setupAutoSave, generateNoteTitle } from './editor-core.js';

// 编辑器状态
let editorInstance = null;
let isVisible = false;
let isDragging = false;
let isResizing = false;
let dragOffset = { x: 0, y: 0 };
let resizeDirection = '';
let currentNoteTitle = generateNoteTitle(); // 初始化标题

// 默认位置和大小
const DEFAULT_CONFIG = {
    width: 420,
    height: 800,
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
                <button class="vn-tool-btn" data-action="open" title="打开笔记">📜</button>
                <button class="vn-tool-btn" data-action="save" title="保存">💾</button>
                <div class="vn-toolbar-spacer"></div>
                <button class="vn-tool-btn" data-action="folder" title="更换保存目录">📂</button>
            </div>
            <div class="vn-note-content">
                <!-- 属性区（可折叠） -->
                <div class="vn-properties-section">
                    <div class="vn-properties-header">
                        <span class="vn-properties-toggle">▼</span>
                        <span class="vn-properties-title">属性</span>
                    </div>
                    <div class="vn-properties-body">
                        <div class="vn-properties-list"></div>
                        <button class="vn-add-property-btn">+ 添加属性</button>
                    </div>
                </div>
                <!-- 正文区 -->
                <div class="vn-body-section">
                    <div class="vn-live-editor" contenteditable="true" placeholder="在这里写笔记..."></div>
                </div>
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

    // 注册到实例
    editorInstance = {
        container,
        shadow,
        wrapper: editorWrapper,
        liveEditor: shadow.querySelector('.vn-live-editor'),
        propertiesSection: shadow.querySelector('.vn-properties-section'),
        propertiesBody: shadow.querySelector('.vn-properties-body'),
        propertiesList: shadow.querySelector('.vn-properties-list'),
        screenshotsList: shadow.querySelector('.vn-screenshots-list'),
        screenshots: [],
        properties: [],
        content: ''
    };

    // 初始化属性区（从 Frontmatter 提取属性 + 折叠记忆）
    initPropertiesSection(editorInstance);

    // 默认光标聚焦到正文区
    setTimeout(() => {
        editorInstance.liveEditor.focus();
    }, 100);

    isVisible = true;
    return editorInstance;
}

/**
 * 初始化属性区（双栏键值编辑器）
 */








/**
 * 绑定编辑器事件
 */
function bindEditorEvents(shadow, wrapper) {
    const header = shadow.querySelector('.vn-editor-header');
    const closeBtn = shadow.querySelector('.vn-btn-close');
    const minimizeBtn = shadow.querySelector('.vn-btn-minimize');
    const focusBtn = shadow.querySelector('.vn-btn-focus');
    const resizeHandles = shadow.querySelectorAll('.vn-resize-handle');
    const toolBtns = shadow.querySelectorAll('.vn-tool-btn');

    // 拖拽移动 - 绑定到整个 header，但排除交互元素（输入框、按钮）
    header.addEventListener('mousedown', (e) => {
        // 排除按钮和输入框
        const target = e.target;
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' ||
            target.closest('button') || target.closest('input')) {
            return; // 让这些元素正常工作，不启动拖拽
        }

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
        // 防止点击按钮导致编辑器失去焦点（从而丢失光标位置）
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

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

    // 监听窗口消息（用于接收时间戳）
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        const { type, data } = event.data;
        if (type === 'VN_TIMESTAMP_RESULT') {
            const timeStr = formatTimestamp(data.timestamp);
            const timestampUrl = generateTimestampUrl(data.videoUrl, data.timestamp);
            // 插入时间戳链接，后面加个空格方便继续输入
            const linkHtml = `<a href="${timestampUrl}" class="vn-timestamp-link">${timeStr}</a>&nbsp;`;
            insertHtmlAtCursor(linkHtml);
            // 自动保存
            autoSave();
        }
    });
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
        case 'open':
            showFileListDialog(async (note) => {
                try {
                    const content = await readNote(note.name);
                    if (editorInstance && editorInstance.liveEditor) {
                        currentNoteTitle = note.title;
                        const titleInput = editorInstance.shadow.querySelector('.vn-note-title');
                        if (titleInput) titleInput.value = currentNoteTitle;

                        // 解析 frontmatter 和正文
                        const { properties, body } = parseFrontmatter(content);

                        // 填充属性区
                        editorInstance.properties = properties;
                        renderPropertiesList(editorInstance);

                        // 只填充正文到编辑器
                        editorInstance.liveEditor.innerHTML = markdownToHtml(body);
                        console.log('[Videoo Notee] 已打开笔记:', note.name);

                        // 异步解析图片并替换为 Blob URL
                        const images = editorInstance.liveEditor.querySelectorAll('img');
                        for (const img of images) {
                            const src = img.getAttribute('data-saved-path') || img.getAttribute('src');
                            if (src && !src.match(/^(http|https|blob|data):/)) {
                                try {
                                    const blob = await readResource(src);
                                    if (blob) {
                                        const url = URL.createObjectURL(blob);
                                        img.src = url;
                                        if (!img.getAttribute('data-saved-path')) {
                                            img.setAttribute('data-saved-path', src);
                                        }
                                    }
                                } catch (err) {
                                    console.warn('无法加载图片资源:', src);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error('[Videoo Notee] 打开笔记失败:', e);
                }
            });
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

    // 在编辑器中插入图片和时间戳
    const imgHtml = `<div class="vn-screenshot-block" data-path="${savedPath}"><img src="${dataUrl}" alt="截图 ${timeStr}" class="vn-screenshot-img" data-saved-path="${savedPath}"><a href="${timestampUrl}" class="vn-timestamp-link">${timeStr}</a></div>`;

    insertHtmlAtCursor(imgHtml);

    // 更新截图缩略图栏
    updateScreenshotsList();

    // 自动保存
    autoSave();
}

/**
 * 在光标处插入 HTML
 */
function insertHtmlAtCursor(html) {
    if (!editorInstance || !editorInstance.liveEditor) return;

    const sel = editorInstance.shadow.getSelection();
    let inserted = false;

    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);

        // 检查选区是否在编辑器内
        if (editorInstance.liveEditor.contains(range.commonAncestorContainer)) {
            range.deleteContents();

            // 创建文档片段
            const div = document.createElement('div');
            div.innerHTML = html;
            const frag = document.createDocumentFragment();
            let lastNode;
            while (div.firstChild) {
                lastNode = div.firstChild;
                frag.appendChild(lastNode);
            }

            range.insertNode(frag);

            // 移动光标到插入内容之后
            if (lastNode) {
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }

            inserted = true;
        }
    }

    // 如果未能在光标处插入（例如失去焦点），则追加到末尾
    if (!inserted) {
        editorInstance.liveEditor.insertAdjacentHTML('beforeend', html);
        editorInstance.liveEditor.scrollTop = editorInstance.liveEditor.scrollHeight;
    }
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
        // 生成属性区 Frontmatter
        const frontmatter = propertiesToFrontmatter(editorInstance.properties || []);

        // 转换编辑器内容为 Markdown（正文部分）
        const bodyMarkdown = htmlToMarkdown(editorInstance.liveEditor.innerHTML);

        // 完整内容 = Frontmatter + 正文
        const fullContent = frontmatter + bodyMarkdown;

        // 保存到本地文件
        await saveNoteToLocal(currentNoteTitle, fullContent);

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

        /* Properties Section */
        .vn-properties-section {
            background: rgba(49, 50, 68, 0.5);
            border-bottom: 1px solid #313244;
        }

        .vn-properties-section.collapsed .vn-properties-body {
            display: none;
        }

        .vn-properties-header {
            display: flex;
            align-items: center;
            padding: 8px 16px;
            cursor: pointer;
            user-select: none;
            transition: background 0.2s;
        }

        .vn-properties-header:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .vn-properties-toggle {
            color: #6c7086;
            font-size: 10px;
            margin-right: 8px;
            transition: transform 0.2s;
        }

        .vn-properties-title {
            font-size: 12px;
            font-weight: 600;
            color: #89b4fa;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .vn-properties-body {
            padding: 8px 16px 12px;
        }

        .vn-properties-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .vn-property-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .vn-property-key {
            width: 80px;
            flex-shrink: 0;
            padding: 6px 8px;
            background: rgba(30, 30, 46, 0.8);
            border: 1px solid #313244;
            border-radius: 4px;
            color: #89b4fa;
            font-size: 12px;
            font-weight: 500;
            outline: none;
        }

        .vn-property-key:focus {
            border-color: #89b4fa;
        }

        .vn-property-value {
            flex: 1;
            padding: 6px 8px;
            background: rgba(30, 30, 46, 0.8);
            border: 1px solid #313244;
            border-radius: 4px;
            color: #cdd6f4;
            font-size: 12px;
            outline: none;
        }

        .vn-property-value:focus {
            border-color: #89b4fa;
        }

        .vn-property-delete {
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            color: #6c7086;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .vn-property-delete:hover {
            background: #f38ba8;
            color: white;
        }

        .vn-add-property-btn {
            margin-top: 8px;
            padding: 6px 12px;
            background: transparent;
            border: 1px dashed #313244;
            border-radius: 4px;
            color: #6c7086;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .vn-add-property-btn:hover {
            border-color: #89b4fa;
            color: #89b4fa;
        }

        /* Body Section */
        .vn-body-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
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
