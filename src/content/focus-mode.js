/**
 * 视频模式（Focus Mode）
 * 提取原生视频播放器到全屏容器，右侧嵌入编辑器
 */

import { initFileSystem, getDirectoryName, readNote, readResource } from '../lib/local-storage.js';
import { checkAndShowDirectoryDialog } from './directory-dialog.js';
import { showFileListDialog } from './file-list-dialog.js';
import {
    createEditorContent,
    initEditorCore,
    saveNote,
    getEditorCoreStyles,
    parseFrontmatter,
    getEditorInstance,
    markdownToHtml,
    renderPropertiesList,
    loadEditorImages,
    insertScreenshot,
    insertTimestamp,
    setupAutoSave,
    generateNoteTitle
} from './editor-core.js';
import { getBilibiliVideoInfo, fetchSubtitleList, fetchSubtitleContent } from './subtitle-manager.js';

// Focus Mode 状态
let focusModeActive = false;
let focusContainer = null;
let originalPlayerInfo = null;
let embeddedEditor = null;
let currentNoteTitle = generateNoteTitle(); // 初始化时生成默认标题
let videoElement = null; // 当前视频元素引用
let subtitleData = [];   // 当前字幕数据
let currentSubtitleIndex = -1; // 当前高亮的字幕索引

let resizeHandlerMove = null;
let resizeHandlerUp = null;

// 平台播放器选择器配置
const PLAYER_SELECTORS = {
    bilibili: [
        '.bpx-player-container',
        '#player_module',
        '#bilibili-player',
        '.player-container',
        '.bilibili-player-video-wrap'
    ],
    youtube: [
        '#player-container-outer', // YouTube Theater mode container
        '#player-container-inner',
        '#player-container',
        '.html5-video-player',
        '#movie_player',
        '.video-stream',
        'ytd-player' // YouTube main player component
    ]
};

// 倍速选项
const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

/**
 * 检测当前平台
 */
function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('bilibili.com')) return 'bilibili';
    if (host.includes('youtube.com')) return 'youtube';
    return 'unknown';
}

/**
 * 获取播放器元素
 */
function getPlayerElement() {
    const platform = detectPlatform();
    const selectors = PLAYER_SELECTORS[platform] || [];

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.offsetHeight > 0) return el;
    }
    return document.querySelector('video')?.parentElement; // Fallback
}

/**
 * 切换 Focus Mode
 */
export function toggleFocusMode() {
    if (focusModeActive) {
        exitFocusMode();
    } else {
        enterFocusMode();
    }
}

/**
 * 进入 Focus Mode
 */
export function enterFocusMode() {
    if (focusModeActive) return;

    const player = getPlayerElement();
    if (!player) {
        console.warn('未找到视频播放器');
        return;
    }

    // 保存原始状态
    originalPlayerInfo = {
        parent: player.parentElement,
        nextSibling: player.nextElementSibling,
        style: player.getAttribute('style') || ''
    };

    // 创建全屏容器
    focusContainer = createFocusModeContainer();
    document.body.appendChild(focusContainer);

    // 移动播放器
    const videoArea = focusContainer.querySelector('.vn-focus-video-area');
    videoArea.appendChild(player);

    // 强制样式适配
    player.dataset.originalStyle = originalPlayerInfo.style;
    player.style.width = '100% !important';
    player.style.height = '100% !important';
    player.style.position = 'relative !important';
    player.style.left = '0 !important';
    player.style.top = '0 !important';
    player.style.margin = '0 !important';
    player.style.zIndex = '1 !important';
    player.style.transform = 'none !important'; // 修复部分播放器缩放问题
    player.style.maxWidth = 'none !important';
    player.style.maxHeight = 'none !important';

    // 针对 YouTube 的特殊处理
    if (detectPlatform() === 'youtube') {
        const video = player.querySelector('video');
        if (video) {
            video.style.left = '0';
            video.style.top = '0';
            video.style.width = '100%';
            video.style.height = '100%';
        }
    }

    // 创建内嵌编辑器
    const editorArea = focusContainer.querySelector('.vn-focus-editor-area');
    createEmbeddedEditor(editorArea);

    focusModeActive = true;
    document.body.style.overflow = 'hidden'; // 禁止页面滚动

    // 添加消息监听器
    window.addEventListener('message', handleVideooMessage);

    // 触发一次 resize 事件通知播放器适配
    requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
    });
}

/**
 * 退出 Focus Mode
 */
export function exitFocusMode() {
    if (!focusModeActive || !originalPlayerInfo) return;

    const player = focusContainer.querySelector('.vn-focus-video-area').children[0];
    if (player) {
        // 恢复播放器位置
        player.setAttribute('style', originalPlayerInfo.style);
        delete player.dataset.originalStyle;

        if (originalPlayerInfo.nextSibling) {
            originalPlayerInfo.parent.insertBefore(player, originalPlayerInfo.nextSibling);
        } else {
            originalPlayerInfo.parent.appendChild(player);
        }

        // 强制触发一次 resize 以通知播放器恢复布局
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

    // 移除容器
    focusContainer.remove();
    focusContainer = null;
    originalPlayerInfo = null;
    embeddedEditor = null;
    focusModeActive = false;
    document.body.style.overflow = '';

    // 移除消息监听器
    window.removeEventListener('message', handleVideooMessage);

    // 移除 resize 监听器
    if (resizeHandlerMove) window.removeEventListener('mousemove', resizeHandlerMove);
    if (resizeHandlerUp) window.removeEventListener('mouseup', resizeHandlerUp);

    // 移除字幕相关的监听
    if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement = null;
    }
    subtitleData = [];
    currentSubtitleIndex = -1;
}

/**
 * 判断是否处于 Focus Mode
 */
export function isFocusModeActive() {
    return focusModeActive;
}

/**
 * 创建全屏容器结构
 */
function createFocusModeContainer() {
    const container = document.createElement('div');
    container.className = 'vn-focus-mode-container';

    // 生成倍速按钮 HTML
    const speedButtonsHtml = SPEED_OPTIONS.map(rate =>
        `<button class="vn-speed-btn" data-rate="${rate}">${rate}x</button>`
    ).join('');

    container.innerHTML = `
        <div class="vn-focus-header">
            <div class="vn-focus-controls">
                <span class="vn-focus-label">倍速:</span>
                ${speedButtonsHtml}
            </div>
            <button class="vn-focus-close">✕ 退出全屏</button>
        </div>
        <div class="vn-focus-content">
            <div class="vn-focus-video-area"></div>
            <div class="vn-focus-resizer"></div>
            <div class="vn-focus-editor-area"></div>
        </div>
        <style>${getFocusModeStyles()}</style>
    `;

    // 绑定关闭事件
    container.querySelector('.vn-focus-close').addEventListener('click', exitFocusMode);

    // 绑定倍速事件
    container.querySelectorAll('.vn-speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rate = parseFloat(btn.dataset.rate);
            const video = document.querySelector('video');
            if (video) {
                video.playbackRate = rate;
                // 更新选中状态
                container.querySelectorAll('.vn-speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    // 绑定调整大小事件
    const resizer = container.querySelector('.vn-focus-resizer');
    const editorArea = container.querySelector('.vn-focus-editor-area');
    const videoArea = container.querySelector('.vn-focus-video-area');

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        videoArea.style.pointerEvents = 'none';
        e.preventDefault(); // 防止选中
    });

    // 定义 handler 以便后续移除
    resizeHandlerMove = (e) => {
        if (!isResizing) return;
        requestAnimationFrame(() => {
            const containerWidth = container.offsetWidth;
            const newWidth = containerWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= 1200) {
                editorArea.style.width = `${newWidth}px`;
            }
        });
    };

    resizeHandlerUp = () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            videoArea.style.pointerEvents = '';
            // 结束后再次触发 resize 适配播放器
            window.dispatchEvent(new Event('resize'));
        }
    };

    window.addEventListener('mousemove', resizeHandlerMove);
    window.addEventListener('mouseup', resizeHandlerUp);

    return container;
}

/**
 * 创建内嵌编辑器（复用 editor-core）
 */
async function createEmbeddedEditor(container) {
    // 确保文件系统访问权限
    const hasAccess = await initFileSystem();
    if (!hasAccess) {
        // 尝试自动或者静默不做，因为不能在非用户触发下弹窗
        // 这里依赖于之前可能已经授权过
    }

    // 生成标题
    const videoTitle = document.title.replace(/[-_|].*/g, '').trim();
    currentNoteTitle = `${videoTitle}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}`;

    // 创建编辑器外壳
    container.innerHTML = `
        <div class="vn-embedded-editor">
            <div class="vn-embedded-header">
                <input type="text" class="vn-embedded-title" value="${currentNoteTitle}" placeholder="笔记标题">
                <span class="vn-embedded-save-status">📁 ${getDirectoryName() || '未选择'}</span>
            </div>

            <!-- Tabs -->
            <div class="vn-embedded-tabs">
                <button class="vn-tab-btn active" data-tab="note">📝 笔记</button>
                <button class="vn-tab-btn" data-tab="subtitle">💬 字幕 (Beta)</button>
            </div>

            <!-- Tab Content: Note -->
            <div class="vn-tab-content active" id="vn-tab-note">
                <div class="vn-embedded-toolbar">
                    <button class="vn-embedded-tool" data-action="screenshot" title="截图">📸</button>
                    <button class="vn-embedded-tool" data-action="timestamp" title="时间戳">⏱️</button>
                    <button class="vn-embedded-tool" data-action="open" title="打开笔记">📜</button>
                    <button class="vn-embedded-tool" data-action="save" title="保存">💾</button>
                </div>
                <div class="vn-embedded-core-container"></div>
            </div>

            <!-- Tab Content: Subtitle -->
            <div class="vn-tab-content" id="vn-tab-subtitle">
                <div class="vn-subtitle-controls">
                    <select class="vn-subtitle-lang-select" disabled>
                        <option>加载中...</option>
                    </select>
                    <button class="vn-subtitle-refresh" title="刷新字幕">🔄</button>
                </div>
                <div class="vn-subtitle-list">
                    <div class="vn-subtitle-empty">请点击刷新获取字幕 / 暂无字幕</div>
                </div>
            </div>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = getEmbeddedEditorStyles() + getEditorCoreStyles();
    container.appendChild(style);

    // 创建并插入编辑器核心
    const coreContainer = container.querySelector('.vn-embedded-core-container');
    const editorCore = createEditorContent('focus-mode');
    coreContainer.appendChild(editorCore);

    // 初始化编辑器核心
    await initEditorCore('focus-mode', currentNoteTitle);

    // 启用自动保存 (1秒延迟)
    const instance = getEditorInstance('focus-mode');
    setupAutoSave(instance, () => saveEmbeddedNote(true), 1000);

    // 获取编辑器元素
    const titleInput = container.querySelector('.vn-embedded-title');
    const saveStatus = container.querySelector('.vn-embedded-save-status');
    embeddedEditor = { container, titleInput, saveStatus };

    // 绑定工具栏事件
    const toolbar = container.querySelector('.vn-embedded-toolbar');
    toolbar.querySelectorAll('.vn-embedded-tool').forEach(btn => {
        btn.addEventListener('mousedown', e => e.preventDefault());
        btn.addEventListener('click', () => handleEmbeddedToolAction(btn.dataset.action));
    });

    // 键盘事件阻断 (防止触发播放器快捷键)
    const editorArea = container.querySelector('.vn-embedded-editor');
    const stopPropagation = (e) => {
        // 允许 Escape 退出
        if (e.key === 'Escape') return;
        e.stopPropagation();
    };

    editorArea.addEventListener('keydown', stopPropagation);
    editorArea.addEventListener('keypress', stopPropagation);
    editorArea.addEventListener('keyup', stopPropagation);

    titleInput.addEventListener('keypress', stopPropagation);
    titleInput.addEventListener('keyup', stopPropagation);

    // --- Tab 切换逻辑 ---
    const tabBtns = container.querySelectorAll('.vn-tab-btn');
    const tabContents = container.querySelectorAll('.vn-tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 切换按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 切换内容显示
            const targetId = `vn-tab-${btn.dataset.tab}`;
            tabContents.forEach(c => {
                if (c.id === targetId) {
                    c.classList.add('active');
                    // 如果切换到字幕 Tab 且无数据，自动加载
                    if (btn.dataset.tab === 'subtitle' && subtitleData.length === 0) {
                        tryLoadSubtitles(container);
                    }
                } else {
                    c.classList.remove('active');
                }
            });
        });
    });

    // --- 字幕刷新按钮 ---
    const refreshBtn = container.querySelector('.vn-subtitle-refresh');
    refreshBtn.addEventListener('click', () => tryLoadSubtitles(container));

    // --- 尝试获取视频元素 ---
    // (enterFocusMode 已经 append 了 player，这里尝试从里面找 video)
    const playerContainer = document.querySelector('.vn-focus-video-area');
    if (playerContainer) {
        videoElement = playerContainer.querySelector('video');
        if (videoElement) {
            videoElement.addEventListener('timeupdate', handleTimeUpdate);
            console.log('[Focus Mode] Video element bound for subtitles');
        }
    }
}

/**
 * 尝试加载字幕
 */
async function tryLoadSubtitles(container) {
    const listContainer = container.querySelector('.vn-subtitle-list');
    const langSelect = container.querySelector('.vn-subtitle-lang-select');

    listContainer.innerHTML = '<div class="vn-subtitle-loading">正在获取字幕列表...</div>';
    langSelect.innerHTML = '<option>加载中...</option>';
    langSelect.disabled = true;

    try {
        // 1. 获取视频信息
        const info = await getBilibiliVideoInfo();
        if (!info) {
            throw new Error('无法获取视频信息 (非 Bilibili 视频?)');
        }

        // 2. 获取字幕列表
        const list = await fetchSubtitleList(info);
        if (list.length === 0) {
            listContainer.innerHTML = '<div class="vn-subtitle-empty">当前视频无可用字幕</div>';
            langSelect.innerHTML = '<option>无字幕</option>';
            return;
        }

        // 3. 填充语言选择
        langSelect.innerHTML = list.map((sub, idx) =>
            `<option value="${sub.url}" ${idx === 0 ? 'selected' : ''}>${sub.label || sub.lang}</option>`
        ).join('');
        langSelect.disabled = false;

        // 绑定语言切换事件
        // 移除旧监听器避免重复? createEmbeddedEditor 只调一次，没问题。
        // 但 tryLoadSubtitles 可能被多次调用，这里简单处理：重新替换 element 或 listener
        // 简单起见，假设用户变更选项会触发 change
        langSelect.onchange = async () => {
            await loadSubtitleContent(langSelect.value, listContainer);
        };

        // 4. 加载默认选中的字幕内容
        if (list[0]?.url) {
            await loadSubtitleContent(list[0].url, listContainer);
        }

    } catch (e) {
        console.error(e);
        listContainer.innerHTML = `<div class="vn-subtitle-error">加载失败: ${e.message}</div>`;
        langSelect.innerHTML = '<option>错误</option>';
    }
}

/**
 * 加载并渲染具体字幕内容
 */
async function loadSubtitleContent(url, container) {
    container.innerHTML = '<div class="vn-subtitle-loading">正在下载字幕内容...</div>';
    try {
        const content = await fetchSubtitleContent(url);
        subtitleData = content;
        renderSubtitleList(container);
    } catch (e) {
        container.innerHTML = `<div class="vn-subtitle-error">内容下载失败: ${e.message}</div>`;
    }
}

/**
 * 渲染字幕列表 DOM
 */
function renderSubtitleList(container) {
    if (subtitleData.length === 0) {
        container.innerHTML = '<div class="vn-subtitle-empty">字幕内容为空</div>';
        return;
    }

    container.innerHTML = subtitleData.map((item, index) => `
        <div class="vn-subtitle-item" data-index="${index}" data-start="${item.start}">
            <span class="vn-sub-time">${formatTime(item.start)}</span>
            <span class="vn-sub-text">${escapeHtml(item.text)}</span>
        </div>
    `).join('');

    // 绑定点击跳转
    container.querySelectorAll('.vn-subtitle-item').forEach(item => {
        item.addEventListener('click', () => {
            const start = parseFloat(item.dataset.start);
            if (videoElement) {
                videoElement.currentTime = start;
                videoElement.play();
            }
        });
    });
}

/**
 * 格式化时间 (简易版)
 */
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * 简单的 HTML 转义
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/**
 * 视频播放进度更新处理 (高亮字幕)
 */
function handleTimeUpdate() {
    if (!videoElement || subtitleData.length === 0) return;

    const currentTime = videoElement.currentTime;

    // 查找当前应该高亮的字幕
    // 简单遍历，由于是顺序的，可以优化，但 1000条以内遍历通常也很快
    const activeIndex = subtitleData.findIndex(item =>
        currentTime >= item.start && currentTime < item.end
    );

    if (activeIndex !== -1 && activeIndex !== currentSubtitleIndex) {
        // 更新高亮样式
        const container = document.querySelector('.vn-subtitle-list');
        if (!container) return; // 可能是 Tab 没显示

        const prev = container.querySelector(`.vn-subtitle-item[data-index="${currentSubtitleIndex}"]`);
        if (prev) prev.classList.remove('active');

        const curr = container.querySelector(`.vn-subtitle-item[data-index="${activeIndex}"]`);
        if (curr) {
            curr.classList.add('active');
            // 自动滚动到可视区域
            curr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        currentSubtitleIndex = activeIndex;
    }
}

/**
 * 处理内嵌编辑器工具栏操作
 */
function handleEmbeddedToolAction(action) {
    switch (action) {
        case 'screenshot':
            window.postMessage({ type: 'VN_REQUEST_SCREENSHOT' }, '*');
            break;
        case 'timestamp':
            window.postMessage({ type: 'VN_REQUEST_TIMESTAMP' }, '*');
            break;
        case 'open':
            showFileListDialog(async (note) => {
                try {
                    const content = await readNote(note.name);
                    const editorInstance = getEditorInstance('focus-mode');

                    if (editorInstance && editorInstance.liveEditor) {
                        currentNoteTitle = note.title;
                        const titleInput = embeddedEditor.titleInput;
                        if (titleInput) titleInput.value = currentNoteTitle;

                        // 解析 frontmatter 和正文
                        const { properties, body } = parseFrontmatter(content);

                        // 填充属性区
                        editorInstance.properties = properties;

                        // 更新属性区 UI (使用 editor-core 导出的函数)
                        renderPropertiesList(editorInstance);

                        // 填充正文 (Markdown 转 HTML)
                        editorInstance.liveEditor.innerHTML = markdownToHtml(body);

                        // 加载本地图片
                        loadEditorImages('focus-mode');

                        console.log('[Focus Mode] 已打开笔记:', note.name);
                    }
                } catch (e) {
                    console.error('[Focus Mode] 打开笔记失败:', e);
                }
            });
            break;
        case 'save':
            saveEmbeddedNote();
            break;
    }
}

/**
 * 全局消息处理函数 (具名函数以避免重复绑定)
 */
async function handleVideooMessage(event) {
    if (event.source !== window) return;
    const { type, data } = event.data || {};

    // 仅在 Focus Mode 激活时处理
    if (!isFocusModeActive()) return;

    if (type === 'VN_SCREENSHOT_RESULT' && data) {
        await insertScreenshot('focus-mode', data.dataUrl, data.timestamp, data.videoUrl);
        saveEmbeddedNote();
    }

    if (type === 'VN_TIMESTAMP_RESULT' && data) {
        insertTimestamp('focus-mode', data.timestamp, data.videoUrl);
    }
}




/**
 * 保存内嵌编辑器笔记
 * @param {boolean} silent 是否静默保存 (不弹错误Alert，仅更新UI状态)
 */
async function saveEmbeddedNote(silent = false) {
    if (!embeddedEditor) return;
    const title = embeddedEditor.titleInput.value.trim() || currentNoteTitle;

    // 更新状态为 "保存中..."
    if (embeddedEditor.saveStatus) embeddedEditor.saveStatus.textContent = '保存中...';

    try {
        await saveNote('focus-mode', title);
        // 更新状态 "已保存"
        if (embeddedEditor.saveStatus) {
            embeddedEditor.saveStatus.textContent = '已保存';
            embeddedEditor.saveStatus.style.color = '#a6adc8'; // 恢复默认色

            // 2秒后清除文字，保持界面清爽，或者保留 "已保存"
            setTimeout(() => {
                if (embeddedEditor.saveStatus.textContent === '已保存') {
                    embeddedEditor.saveStatus.textContent = '';
                }
            }, 2000);
        }
    } catch (e) {
        if (!silent) console.error(e);
        if (embeddedEditor.saveStatus) {
            embeddedEditor.saveStatus.textContent = '保存失败';
            embeddedEditor.saveStatus.style.color = '#f38ba8';
        }
    }
}

/**
 * 获取视频模式样式
 */
function getFocusModeStyles() {
    return `
        .vn-focus-mode-container {
            position: fixed !important;
            inset: 0 !important;
            z-index: 2147483646 !important;
            background: #0a0a0f !important;
            display: flex !important;
            flex-direction: column !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        .vn-focus-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 0 20px !important;
            height: 48px !important;
            background: #11111b !important;
            border-bottom: 1px solid #313244 !important;
        }

        .vn-focus-title {
            color: #cdd6f4 !important;
            font-weight: 600 !important;
            font-size: 16px !important;
        }

        .vn-focus-close {
            background: transparent !important;
            border: 1px solid #45475a !important;
            color: #cdd6f4 !important;
            padding: 4px 12px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 13px !important;
            transition: all 0.2s !important;
        }

        .vn-focus-close:hover {
            background: #f38ba8 !important;
            border-color: #f38ba8 !important;
            color: #11111b !important;
        }

        .vn-focus-content {
            flex: 1 !important;
            display: flex !important;
            overflow: hidden !important;
        }

        .vn-focus-video-area {
            flex: 1 !important;
            background: #000 !important;
            position: relative !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        }

        .vn-focus-resizer {
            width: 10px; /* 加宽以便抓取 */
            margin: 0 -1px; /* 微调位置 */
            background: #313244; /* 提亮颜色以便看见 */
            cursor: col-resize;
            border-left: 1px solid #45475a;
            border-right: 1px solid #45475a;
            position: relative;
            z-index: 2147483647 !important; /* 最高层级 */
            transition: background 0.2s;
            flex-shrink: 0 !important; /* 防止被压缩 */
        }

        .vn-focus-controls {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .vn-focus-label {
            color: #a6adc8;
            font-size: 13px;
        }

        .vn-speed-btn {
            background: #313244;
            color: #bac2de;
            border: 1px solid #45475a;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .vn-speed-btn:hover {
            background: #45475a;
            color: #cdd6f4;
        }

        .vn-speed-btn.active {
            background: #89b4fa;
            color: #1e1e2e;
            border-color: #89b4fa;
            font-weight: 600;
        }

        .vn-focus-resizer:hover {
            background: #89b4fa;
        }

        .vn-focus-editor-area {
            width: 420px; /* 移除 !important 允许 JS 修改 */
            background: #1e1e2e !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
            z-index: 2 !important;
        }
    `;
}

/**
 * 获取内嵌编辑器外壳样式
 */
function getEmbeddedEditorStyles() {
    return `
        .vn-embedded-editor {
            display: flex;
            flex-direction: column;
            height: 100%;
            color: #cdd6f4;
        }
        .vn-embedded-header {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            gap: 12px;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 1px solid #313244;
        }
        .vn-embedded-title {
            flex: 1;
            background: transparent;
            border: none;
            color: #cdd6f4;
            font-size: 16px;
            font-weight: 600;
            outline: none;
        }
        .vn-embedded-title::placeholder {
            color: #6c7086;
        }
        .vn-embedded-save-status {
            font-size: 12px;
            color: #6c7086;
        }
        .vn-embedded-toolbar {
            display: flex;
            padding: 8px 16px;
            gap: 8px;
            background: rgba(0, 0, 0, 0.2);
            border-bottom: 1px solid #313244;
        }
        .vn-embedded-tool {
            padding: 6px 12px;
            background: #313244;
            border: none;
            border-radius: 6px;
            color: #cdd6f4;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        .vn-embedded-tool:hover {
            background: #45475a;
        }
        .vn-embedded-core-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
        }

        /* Tabs Styles */
        .vn-embedded-tabs {
            display: flex;
            background: #181825;
            border-bottom: 1px solid #313244;
        }
        .vn-tab-btn {
            flex: 1;
            padding: 8px;
            background: transparent;
            border: none;
            color: #a6adc8;
            cursor: pointer;
            font-size: 13px;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        .vn-tab-btn:hover {
            color: #cdd6f4;
            background: #1e1e2e;
        }
        .vn-tab-btn.active {
            color: #89b4fa;
            border-bottom-color: #89b4fa;
            background: #1e1e2e;
            font-weight: 600;
        }
        .vn-tab-content {
            display: none;
            flex: 1;
            flex-direction: column;
            min-height: 0; /* 关键：允许 flex item 滚动 */
            overflow: hidden;
        }
        .vn-tab-content.active {
            display: flex;
        }

        /* Subtitle Styles */
        .vn-subtitle-controls {
            display: flex;
            gap: 8px;
            padding: 8px;
            background: #181825;
            border-bottom: 1px solid #313244;
        }
        .vn-subtitle-lang-select {
            flex: 1;
            background: #313244;
            color: #cdd6f4;
            border: 1px solid #45475a;
            border-radius: 4px;
            padding: 4px;
            outline: none;
        }
        .vn-subtitle-refresh {
            background: #313244;
            border: 1px solid #45475a;
            color: #cdd6f4;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
        }
        .vn-subtitle-refresh:hover {
            background: #45475a;
        }
        .vn-subtitle-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px 0;
            background: #1e1e2e;
        }
        .vn-subtitle-item {
            padding: 6px 12px;
            cursor: pointer;
            display: flex;
            gap: 10px;
            border-left: 3px solid transparent;
        }
        .vn-subtitle-item:hover {
            background: #313244;
        }
        .vn-subtitle-item.active {
            background: #313244;
            border-left-color: #89b4fa;
        }
        .vn-sub-time {
            color: #89b4fa;
            font-family: monospace;
            font-size: 12px;
            min-width: 40px;
            flex-shrink: 0;
        }
        .vn-sub-text {
            color: #cdd6f4;
            font-size: 13px;
        }
        .vn-subtitle-loading, .vn-subtitle-error, .vn-subtitle-empty {
            padding: 20px;
            text-align: center;
            color: #a6adc8;
            font-size: 13px;
        }
        .vn-subtitle-error {
            color: #f38ba8;
        }
    `;
}
