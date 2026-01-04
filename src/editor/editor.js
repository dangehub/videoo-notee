/**
 * 编辑器主脚本
 */

import browser from '../lib/browser-polyfill.js';
import { generateMarkdown, generateFilename } from '../lib/markdown.js';
import { formatTimestamp } from '../lib/timestamp.js';
import { AISummarizer } from '../lib/ai/summarizer.js';

// 状态
let currentNote = null;
let notes = [];
let editorMode = 'edit';  // 'edit' | 'live' | 'preview'
let aiSummarizer = null;

// DOM 元素引用
const elements = {
    sidebar: null,
    notesTree: null,
    noteTitle: null,
    editorTextarea: null,
    editorPane: null,
    liveEditorPane: null,
    liveEditor: null,
    previewPane: null,
    markdownPreview: null,
    screenshotsList: null,
    subtitlePanel: null,
    subtitleContent: null,
    videoTitleDisplay: null,
    videoTimeDisplay: null,
    settingsModal: null
};

/**
 * 初始化
 */
async function init() {
    // 获取 DOM 元素
    elements.sidebar = document.getElementById('sidebar');
    elements.notesTree = document.getElementById('notes-tree');
    elements.noteTitle = document.getElementById('note-title');
    elements.editorTextarea = document.getElementById('editor-textarea');
    elements.editorPane = document.getElementById('editor-pane');
    elements.liveEditorPane = document.getElementById('live-editor-pane');
    elements.liveEditor = document.getElementById('live-editor');
    elements.previewPane = document.getElementById('preview-pane');
    elements.markdownPreview = document.getElementById('markdown-preview');
    elements.screenshotsList = document.getElementById('screenshots-list');
    elements.subtitlePanel = document.getElementById('subtitle-panel');
    elements.subtitleContent = document.getElementById('subtitle-content');
    elements.videoTitleDisplay = document.getElementById('video-title-display');
    elements.videoTimeDisplay = document.getElementById('video-time-display');
    elements.settingsModal = document.getElementById('settings-modal');

    // 初始化 AI 服务
    aiSummarizer = new AISummarizer();
    await aiSummarizer.loadConfig();

    // 绑定事件
    bindEvents();

    // 加载笔记列表
    await loadNotes();

    // 检查 URL 参数
    const params = new URLSearchParams(location.search);
    const noteId = params.get('note');
    if (noteId) {
        openNote(noteId);
    } else {
        // 新建笔记
        newNote();
    }

    // 检查是否打开设置
    if (location.hash === '#settings') {
        openSettings();
    }

    // 监听来自后台的消息
    browser.runtime.onMessage.addListener(handleMessage);
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 侧边栏切换
    document.getElementById('btn-toggle-sidebar').addEventListener('click', toggleSidebar);

    // 新建笔记
    document.getElementById('btn-new-note').addEventListener('click', newNote);

    // 搜索
    document.getElementById('search-input').addEventListener('input', handleSearch);

    // 模式切换
    document.getElementById('btn-mode-edit').addEventListener('click', () => setEditorMode('edit'));
    document.getElementById('btn-mode-live').addEventListener('click', () => setEditorMode('live'));
    document.getElementById('btn-mode-preview').addEventListener('click', () => setEditorMode('preview'));

    // 工具栏按钮
    document.getElementById('btn-screenshot').addEventListener('click', insertScreenshot);
    document.getElementById('btn-timestamp').addEventListener('click', insertTimestamp);
    document.getElementById('btn-subtitle').addEventListener('click', toggleSubtitlePanel);
    document.getElementById('btn-ai-summary').addEventListener('click', requestAISummary);
    document.getElementById('btn-open-mode')?.addEventListener('click', toggleWindowMode);
    document.getElementById('btn-export').addEventListener('click', exportNote);
    document.getElementById('btn-save').addEventListener('click', saveNote);

    // 字幕面板
    document.getElementById('btn-close-subtitle').addEventListener('click', () => {
        elements.subtitlePanel.classList.add('hidden');
    });
    document.getElementById('btn-copy-subtitle').addEventListener('click', copySubtitle);
    document.getElementById('btn-ai-summarize').addEventListener('click', summarizeSubtitle);

    // 设置
    document.getElementById('btn-settings')?.addEventListener('click', openSettings);
    document.getElementById('btn-close-settings').addEventListener('click', closeSettings);
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);

    // 编辑器自动保存和同步
    elements.editorTextarea.addEventListener('input', debounce(() => {
        autoSave();
        if (editorMode === 'live') syncToLiveEditor();
    }, 500));
    elements.noteTitle.addEventListener('input', debounce(autoSave, 3000));

    // 实时编辑器输入同步
    elements.liveEditor?.addEventListener('input', debounce(() => {
        syncFromLiveEditor();
        autoSave();
    }, 500));

    // 快捷键
    document.addEventListener('keydown', handleKeydown);

    // 标题变化时更新当前笔记
    elements.noteTitle.addEventListener('change', () => {
        if (currentNote) {
            currentNote.title = elements.noteTitle.value;
        }
    });
}

/**
 * 切换侧边栏
 */
function toggleSidebar() {
    elements.sidebar.classList.toggle('collapsed');
}

/**
 * 新建笔记
 */
async function newNote() {
    // 尝试获取当前视频上下文
    let currentVideo = null;
    let recentScreenshots = [];

    try {
        currentVideo = await browser.runtime.sendMessage({ type: 'GET_CURRENT_VIDEO' });
        recentScreenshots = await browser.runtime.sendMessage({
            type: 'GET_SCREENSHOTS',
            data: currentVideo?.url ? { videoUrl: currentVideo.url } : {}
        });
    } catch (error) {
        console.log('获取视频上下文失败:', error);
    }

    currentNote = {
        id: null,
        title: currentVideo?.title || '',
        content: '',
        videoUrl: currentVideo?.url || '',
        videoTitle: currentVideo?.title || '',
        entries: [],
        screenshots: recentScreenshots.map(ss => ({
            dataUrl: ss.dataUrl,
            timestamp: ss.timestamp,
            addedAt: ss.createdAt
        })),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    elements.noteTitle.value = currentNote.title;
    elements.editorTextarea.value = '';

    if (currentVideo?.url) {
        elements.videoTitleDisplay.textContent = currentVideo.title || '视频笔记';
        elements.videoTimeDisplay.textContent = currentVideo.timestamp
            ? formatTimestamp(currentVideo.timestamp)
            : '--:--';
    } else {
        elements.videoTitleDisplay.textContent = '未关联视频';
        elements.videoTimeDisplay.textContent = '--:--';
    }

    // 渲染截图列表
    renderScreenshots();

    // 取消侧边栏选中状态
    document.querySelectorAll('.note-tree-item').forEach(el => el.classList.remove('active'));
}

/**
 * 加载笔记列表
 */
async function loadNotes() {
    try {
        notes = await browser.runtime.sendMessage({
            type: 'GET_NOTES',
            data: {}
        });

        renderNotesTree();
    } catch (error) {
        console.error('加载笔记失败:', error);
    }
}

/**
 * 渲染笔记树
 */
function renderNotesTree() {
    if (!notes || notes.length === 0) {
        elements.notesTree.innerHTML = '<p style="padding: 16px; color: rgba(255,255,255,0.4); text-align: center;">暂无笔记</p>';
        return;
    }

    elements.notesTree.innerHTML = notes.map(note => `
    <div class="note-tree-item ${currentNote?.id === note.id ? 'active' : ''}" data-id="${note.id}">
      <span class="note-icon">📝</span>
      <span class="note-name">${escapeHtml(note.title || '未命名笔记')}</span>
    </div>
  `).join('');

    // 绑定点击事件
    document.querySelectorAll('.note-tree-item').forEach(item => {
        item.addEventListener('click', () => openNote(item.dataset.id));
    });
}

/**
 * 打开笔记
 */
async function openNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    currentNote = { ...note };

    elements.noteTitle.value = note.title || '';
    elements.editorTextarea.value = note.content || '';
    elements.videoTitleDisplay.textContent = note.videoTitle || '未关联视频';

    // 更新侧边栏选中状态
    document.querySelectorAll('.note-tree-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === noteId);
    });

    // 渲染截图
    renderScreenshots();
}

/**
 * 保存笔记
 */
async function saveNote() {
    if (!currentNote) return;

    currentNote.title = elements.noteTitle.value || '未命名笔记';
    currentNote.content = elements.editorTextarea.value;
    currentNote.updatedAt = Date.now();

    try {
        const result = await browser.runtime.sendMessage({
            type: 'SAVE_NOTE',
            data: currentNote
        });

        if (result.noteId && !currentNote.id) {
            currentNote.id = result.noteId;
        }

        // 重新加载笔记列表
        await loadNotes();

        showToast('保存成功');
    } catch (error) {
        console.error('保存失败:', error);
        showToast('保存失败');
    }
}

/**
 * 自动保存
 */
async function autoSave() {
    if (currentNote && (elements.noteTitle.value || elements.editorTextarea.value)) {
        await saveNote();
    }
}

/**
 * 导出笔记
 */
async function exportNote() {
    if (!currentNote) return;

    currentNote.title = elements.noteTitle.value;
    currentNote.content = elements.editorTextarea.value;

    try {
        const settings = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
        const markdown = generateMarkdown(currentNote, {
            obsidianCompatible: settings.export?.obsidianCompatible ?? true
        });

        // 创建下载
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const filename = generateFilename(currentNote);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        showToast('导出成功');
    } catch (error) {
        console.error('导出失败:', error);
        showToast('导出失败');
    }
}

/**
 * 插入截图
 */
async function insertScreenshot() {
    try {
        // 获取当前活动标签页
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            showToast('无法获取当前标签页');
            return;
        }

        // 请求截图
        const response = await browser.tabs.sendMessage(tab.id, {
            type: 'CAPTURE_VIDEO_FRAME'
        });

        if (response.error) {
            showToast(response.error);
            return;
        }

        // 添加到截图列表
        const screenshot = {
            dataUrl: response.dataUrl,
            timestamp: response.timestamp,
            addedAt: Date.now()
        };

        if (!currentNote.screenshots) {
            currentNote.screenshots = [];
        }
        currentNote.screenshots.push(screenshot);

        // 插入到编辑器
        const timeStr = formatTimestamp(response.timestamp);
        const insertText = `\n![截图 ${timeStr}](${response.dataUrl})\n`;
        insertAtCursor(insertText);

        // 更新截图栏
        renderScreenshots();

        showToast(`已插入截图 ${timeStr}`);
    } catch (error) {
        console.error('截图失败:', error);
        showToast('截图失败，请确保在视频页面');
    }
}

/**
 * 渲染截图列表
 */
function renderScreenshots() {
    if (!currentNote?.screenshots?.length) {
        elements.screenshotsList.innerHTML = '';
        return;
    }

    elements.screenshotsList.innerHTML = currentNote.screenshots.map((ss, index) => {
        // 优先使用文件路径，备用 dataUrl
        const imgSrc = ss.dataUrl || `file:///${ss.filePath?.replace(/\\/g, '/')}`;
        return `
        <img src="${imgSrc}" 
             class="screenshot-thumb" 
             data-index="${index}"
             title="${formatTimestamp(ss.timestamp)} - ${ss.filename || ''}"
             alt="截图 ${index + 1}"
             onerror="this.style.display='none'">
        `;
    }).join('');

    // 点击插入
    document.querySelectorAll('.screenshot-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            const index = parseInt(thumb.dataset.index);
            const ss = currentNote.screenshots[index];
            // 使用文件名或 dataUrl
            const imgRef = ss.filename || ss.dataUrl;
            const insertText = `\n![截图 ${formatTimestamp(ss.timestamp)}](${imgRef})\n`;
            insertAtCursor(insertText);
        });
    });
}

/**
 * 插入时间戳
 */
async function insertTimestamp() {
    try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

        if (tab) {
            const response = await browser.tabs.sendMessage(tab.id, {
                type: 'GET_VIDEO_INFO'
            });

            if (response?.currentTime !== undefined) {
                const timeStr = formatTimestamp(response.currentTime);
                const link = response.url
                    ? `[${timeStr}](${response.url}&t=${Math.floor(response.currentTime)})`
                    : timeStr;
                insertAtCursor(`${link} `);
                return;
            }
        }

        // 如果无法获取，插入空时间戳
        insertAtCursor(`[00:00] `);
    } catch (error) {
        insertAtCursor(`[00:00] `);
    }
}

/**
 * 在光标处插入文本
 */
function insertAtCursor(text) {
    if (editorMode === 'live' && elements.liveEditor) {
        // 在实时编辑器中插入
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            // 如果是图片，创建 img 元素
            const imgMatch = text.match(/!\[(.*?)\]\((.*?)\)/);
            if (imgMatch) {
                const img = document.createElement('img');
                img.src = imgMatch[2];
                img.alt = imgMatch[1];
                range.insertNode(img);
            } else {
                range.insertNode(document.createTextNode(text));
            }
        }
        syncFromLiveEditor();
    } else {
        // 普通 textarea 插入
        const textarea = elements.editorTextarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + text + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
    }
}

/**
 * 设置编辑器模式
 */
function setEditorMode(mode) {
    editorMode = mode;

    // 更新按钮状态
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-mode-${mode}`)?.classList.add('active');

    // 切换面板显示
    elements.editorPane?.classList.toggle('hidden', mode !== 'edit');
    elements.liveEditorPane?.classList.toggle('hidden', mode !== 'live');
    elements.previewPane?.classList.toggle('hidden', mode !== 'preview');

    // 同步内容
    if (mode === 'live') {
        syncToLiveEditor();
    } else if (mode === 'preview') {
        renderPreview();
    }
}

/**
 * 同步内容到实时编辑器（渲染图片）
 */
function syncToLiveEditor() {
    if (!elements.liveEditor) return;

    const content = elements.editorTextarea.value;
    elements.liveEditor.innerHTML = renderLiveContent(content);
}

/**
 * 从实时编辑器同步回 textarea
 */
function syncFromLiveEditor() {
    if (!elements.liveEditor) return;

    // 将 HTML 转换回 Markdown
    const html = elements.liveEditor.innerHTML;
    const md = htmlToMarkdown(html);
    elements.editorTextarea.value = md;

    if (currentNote) {
        currentNote.content = md;
    }
}

/**
 * 渲染实时内容（图片会被渲染）
 */
function renderLiveContent(markdown) {
    if (!markdown) return '';

    // 获取截图映射
    const screenshotMap = {};
    if (currentNote?.screenshots) {
        currentNote.screenshots.forEach(ss => {
            screenshotMap[ss.filename] = ss.dataUrl;
        });
    }

    let html = markdown
        // 图片 - 渲染为 img 标签
        .replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
            // 如果是文件名，尝试映射到 dataUrl
            const actualSrc = screenshotMap[src] || src;
            return `<img src="${actualSrc}" alt="${alt}" data-original-src="${src}">`;
        })
        // 链接
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="timestamp-link">$1</a>')
        // Wikilinks
        .replace(/\[\[(.*?)\]\]/g, '<span class="wikilink">[[$1]]</span>')
        // 粗体
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 斜体
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // 标题
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // 列表
        .replace(/^- (.*$)/gm, '<div>• $1</div>')
        // 换行
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');

    return html;
}

/**
 * 将 HTML 转换回 Markdown
 */
function htmlToMarkdown(html) {
    // 创建临时元素
    const div = document.createElement('div');
    div.innerHTML = html;

    // 递归转换
    function convert(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const tag = node.tagName.toLowerCase();
        const children = Array.from(node.childNodes).map(convert).join('');

        switch (tag) {
            case 'img':
                const src = node.dataset.originalSrc || node.src;
                return `![${node.alt || '截图'}](${src})`;
            case 'a':
                return `[${children}](${node.href})`;
            case 'strong':
            case 'b':
                return `**${children}**`;
            case 'em':
            case 'i':
                return `*${children}*`;
            case 'h1':
                return `# ${children}\n`;
            case 'h2':
                return `## ${children}\n`;
            case 'h3':
                return `### ${children}\n`;
            case 'br':
                return '\n';
            case 'div':
            case 'p':
                return children + '\n';
            case 'span':
                if (node.classList.contains('wikilink')) {
                    return children;
                }
                return children;
            default:
                return children;
        }
    }

    return convert(div).trim();
}

/**
 * 切换窗口模式（侧边栏/新窗口）
 */
function toggleWindowMode() {
    // 如果当前在侧边栏中，打开新窗口
    browser.runtime.sendMessage({
        type: 'OPEN_EDITOR',
        data: { mode: 'standalone' }
    });
}

/**
 * 渲染预览
 */
function renderPreview() {
    const content = elements.editorTextarea.value;
    // 简单的 Markdown 渲染
    let html = content
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\[\[(.*?)\]\]/g, '<span class="wikilink">$1</span>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    elements.markdownPreview.innerHTML = `<p>${html}</p>`;
}

/**
 * 切换字幕面板
 */
function toggleSubtitlePanel() {
    elements.subtitlePanel.classList.toggle('hidden');
}

/**
 * 复制字幕
 */
function copySubtitle() {
    const text = elements.subtitleContent.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板');
    });
}

/**
 * AI 总结字幕
 */
async function summarizeSubtitle() {
    const text = elements.subtitleContent.textContent;
    if (!text) {
        showToast('暂无字幕内容');
        return;
    }

    await requestAISummary(text);
}

/**
 * 请求 AI 总结
 */
async function requestAISummary(text) {
    if (!aiSummarizer.isConfigured()) {
        showToast('请先配置 AI API Key');
        openSettings();
        return;
    }

    const content = text || elements.editorTextarea.value;
    if (!content) {
        showToast('暂无内容可总结');
        return;
    }

    showToast('正在生成 AI 总结...');

    try {
        const summary = await aiSummarizer.summarizeSubtitles(content, {
            language: 'zh-CN',
            style: 'bullet'
        });

        // 插入总结
        insertAtCursor(`\n\n## AI 总结\n\n${summary}\n`);
        showToast('AI 总结已插入');
    } catch (error) {
        console.error('AI 总结失败:', error);
        showToast('AI 总结失败: ' + error.message);
    }
}

/**
 * 搜索笔记
 */
function handleSearch(e) {
    const query = e.target.value.toLowerCase();

    document.querySelectorAll('.note-tree-item').forEach(item => {
        const name = item.querySelector('.note-name').textContent.toLowerCase();
        item.style.display = name.includes(query) ? '' : 'none';
    });
}

/**
 * 处理快捷键
 */
function handleKeydown(e) {
    // Ctrl+S 保存
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveNote();
    }

    // Alt+S 截图
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        insertScreenshot();
    }

    // Alt+T 时间戳
    if (e.altKey && e.key === 't') {
        e.preventDefault();
        insertTimestamp();
    }
}

/**
 * 处理来自后台的消息
 */
function handleMessage(message) {
    switch (message.type) {
        case 'SUBTITLE_LOADED':
            elements.subtitlePanel.classList.remove('hidden');
            elements.subtitleContent.textContent = message.data.text;
            break;

        case 'VIDEO_INFO_UPDATE':
            if (currentNote) {
                currentNote.videoUrl = message.data.url;
                currentNote.videoTitle = message.data.title;
                elements.videoTitleDisplay.textContent = message.data.title || '未知视频';
            }
            break;
    }
}

/**
 * 打开设置
 */
function openSettings() {
    elements.settingsModal.classList.remove('hidden');
    loadSettings();
}

/**
 * 关闭设置
 */
function closeSettings() {
    elements.settingsModal.classList.add('hidden');
}

/**
 * 加载设置
 */
async function loadSettings() {
    const settings = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });

    document.getElementById('setting-api-endpoint').value = settings.ai?.apiEndpoint || '';
    document.getElementById('setting-api-key').value = settings.ai?.apiKey || '';
    document.getElementById('setting-model').value = settings.ai?.model || 'gpt-4';
    document.getElementById('setting-obsidian-compat').checked = settings.export?.obsidianCompatible ?? true;
}

/**
 * 保存设置
 */
async function saveSettings() {
    const settings = {
        ai: {
            apiEndpoint: document.getElementById('setting-api-endpoint').value,
            apiKey: document.getElementById('setting-api-key').value,
            model: document.getElementById('setting-model').value
        },
        export: {
            obsidianCompatible: document.getElementById('setting-obsidian-compat').checked
        }
    };

    await browser.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        data: settings
    });

    // 更新 AI 服务配置
    await aiSummarizer.saveConfig(settings.ai);

    closeSettings();
    showToast('设置已保存');
}

/**
 * 显示提示
 */
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 防抖
 */
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 启动
init();
