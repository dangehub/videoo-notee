/**
 * Popup 弹出窗口脚本
 */

import browser from '../lib/browser-polyfill.js';

// DOM 元素
const btnOpenEditor = document.getElementById('btn-open-editor');
const btnOpenPlayer = document.getElementById('btn-open-player');
const btnScreenshot = document.getElementById('btn-screenshot');
const btnSidebar = document.getElementById('btn-sidebar');
const btnSettings = document.getElementById('btn-settings');
const notesList = document.getElementById('notes-list');

/**
 * 初始化
 */
async function init() {
    // 加载最近笔记
    await loadRecentNotes();

    // 绑定事件
    btnOpenEditor.addEventListener('click', openEditor);
    btnOpenPlayer.addEventListener('click', openPlayer);
    btnScreenshot.addEventListener('click', captureScreenshot);
    btnSidebar.addEventListener('click', openSidebar);
    btnSettings.addEventListener('click', openSettings);
}

/**
 * 打开编辑器（独立页面）
 */
async function openEditor() {
    await browser.tabs.create({
        url: browser.runtime.getURL('editor/index.html')
    });
    window.close();
}

/**
 * 打开本地播放器
 */
async function openPlayer() {
    await browser.tabs.create({
        url: browser.runtime.getURL('player/index.html')
    });
    window.close();
}

/**
 * 截图当前视频
 */
async function captureScreenshot() {
    try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            alert('无法获取当前标签页');
            return;
        }

        // 发送截图请求到内容脚本
        const response = await browser.tabs.sendMessage(tab.id, {
            type: 'CAPTURE_VIDEO_FRAME'
        });

        if (response.error) {
            alert(response.error);
            return;
        }

        // 保存截图
        await browser.runtime.sendMessage({
            type: 'SAVE_SCREENSHOT',
            data: {
                screenshot: response.dataUrl,
                timestamp: response.timestamp,
                videoUrl: tab.url,
                videoTitle: tab.title
            }
        });

        alert('截图成功！');
    } catch (error) {
        console.error('截图失败:', error);
        alert('截图失败，请确保当前页面有视频');
    }
}

/**
 * 打开侧边栏
 */
async function openSidebar() {
    await browser.runtime.sendMessage({
        type: 'OPEN_EDITOR',
        data: { mode: 'sidebar' }
    });
    window.close();
}

/**
 * 打开设置
 */
function openSettings() {
    browser.tabs.create({
        url: browser.runtime.getURL('editor/index.html#settings')
    });
    window.close();
}

/**
 * 加载最近笔记
 */
async function loadRecentNotes() {
    try {
        const notes = await browser.runtime.sendMessage({
            type: 'GET_NOTES',
            data: {}
        });

        if (!notes || notes.length === 0) {
            notesList.innerHTML = '<p class="empty-tip">暂无笔记</p>';
            return;
        }

        // 显示最近 5 条
        const recentNotes = notes.slice(0, 5);

        notesList.innerHTML = recentNotes.map(note => `
      <div class="note-item" data-id="${note.id}">
        <div class="note-icon">📝</div>
        <div class="note-info">
          <div class="note-title">${escapeHtml(note.title || '未命名笔记')}</div>
          <div class="note-meta">${formatDate(note.updatedAt)}</div>
        </div>
      </div>
    `).join('');

        // 点击打开笔记
        notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.id;
                browser.tabs.create({
                    url: browser.runtime.getURL(`editor/index.html?note=${noteId}`)
                });
                window.close();
            });
        });
    } catch (error) {
        console.error('加载笔记失败:', error);
    }
}

/**
 * 格式化日期
 */
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;

    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 启动
init();
