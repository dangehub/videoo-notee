/**
 * 本地视频播放器脚本
 */

import { captureVideoFrame } from '../lib/screenshot.js';
import { formatTimestamp } from '../lib/timestamp.js';
import { generateMarkdown } from '../lib/markdown.js';
import { LocalSubtitleProvider } from '../lib/subtitle/local.js';

// 状态
let currentVideoFile = null;
let subtitleProvider = null;
let subtitleEntries = [];
let noteEntries = [];

// DOM 元素
const videoPlayer = document.getElementById('video-player');
const dropOverlay = document.getElementById('drop-overlay');
const fileInput = document.getElementById('file-input');
const subtitleInput = document.getElementById('subtitle-input');
const noteInput = document.getElementById('note-input');
const noteEntriesContainer = document.getElementById('note-entries');
const subtitleDisplay = document.getElementById('subtitle-display');

/**
 * 初始化
 */
function init() {
    subtitleProvider = new LocalSubtitleProvider();

    // 绑定事件
    bindEvents();
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 拖拽上传
    dropOverlay.addEventListener('dragover', handleDragOver);
    dropOverlay.addEventListener('dragleave', handleDragLeave);
    dropOverlay.addEventListener('drop', handleDrop);
    dropOverlay.addEventListener('click', () => fileInput.click());

    // 文件选择
    fileInput.addEventListener('change', handleFileSelect);
    subtitleInput.addEventListener('change', handleSubtitleSelect);

    // 控制按钮
    document.getElementById('btn-open-file').addEventListener('click', () => fileInput.click());
    document.getElementById('btn-load-subtitle').addEventListener('click', () => subtitleInput.click());
    document.getElementById('btn-screenshot').addEventListener('click', handleScreenshot);
    document.getElementById('btn-add-note').addEventListener('click', handleAddNote);
    document.getElementById('btn-export-note').addEventListener('click', handleExport);

    // 视频时间更新 - 同步字幕
    videoPlayer.addEventListener('timeupdate', updateSubtitle);

    // 快捷键
    document.addEventListener('keydown', handleKeydown);
}

/**
 * 处理拖拽悬停
 */
function handleDragOver(e) {
    e.preventDefault();
    dropOverlay.classList.add('dragging');
}

/**
 * 处理拖拽离开
 */
function handleDragLeave(e) {
    e.preventDefault();
    dropOverlay.classList.remove('dragging');
}

/**
 * 处理拖拽放置
 */
function handleDrop(e) {
    e.preventDefault();
    dropOverlay.classList.remove('dragging');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('video/')) {
            loadVideo(file);
        } else if (file.name.endsWith('.srt') || file.name.endsWith('.vtt')) {
            loadSubtitle(file);
        }
    }
}

/**
 * 处理文件选择
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        loadVideo(file);
    }
}

/**
 * 处理字幕选择
 */
async function handleSubtitleSelect(e) {
    const file = e.target.files[0];
    if (file) {
        await loadSubtitle(file);
    }
}

/**
 * 加载视频
 */
function loadVideo(file) {
    currentVideoFile = file;

    const url = URL.createObjectURL(file);
    videoPlayer.src = url;

    // 隐藏拖拽区域
    dropOverlay.classList.add('hidden');

    // 更新标题
    document.title = `${file.name} - Videoo Notee`;

    console.log('[Videoo Notee] 已加载视频:', file.name);
}

/**
 * 加载字幕
 */
async function loadSubtitle(file) {
    try {
        subtitleEntries = await subtitleProvider.loadFromFile(file);
        console.log('[Videoo Notee] 已加载字幕:', file.name, `共 ${subtitleEntries.length} 条`);
        showToast(`已加载字幕: ${file.name}`);
    } catch (error) {
        console.error('加载字幕失败:', error);
        showToast('加载字幕失败: ' + error.message);
    }
}

/**
 * 更新字幕显示
 */
function updateSubtitle() {
    if (subtitleEntries.length === 0) return;

    const currentTime = videoPlayer.currentTime * 1000; // 转为毫秒

    // 查找当前时间对应的字幕
    const currentSubtitle = subtitleEntries.find(
        entry => currentTime >= entry.start && currentTime <= entry.end
    );

    if (currentSubtitle) {
        subtitleDisplay.textContent = currentSubtitle.text;
        subtitleDisplay.classList.remove('hidden');
    } else {
        subtitleDisplay.classList.add('hidden');
    }
}

/**
 * 处理截图
 */
async function handleScreenshot() {
    if (!videoPlayer.src) {
        showToast('请先加载视频');
        return;
    }

    try {
        const result = await captureVideoFrame(videoPlayer);

        // 创建笔记条目
        const entry = {
            id: Date.now(),
            timestamp: result.timestamp,
            screenshot: result.dataUrl,
            text: noteInput.value.trim()
        };

        noteEntries.push(entry);
        noteInput.value = '';

        renderNoteEntries();
        showToast(`已截图 ${formatTimestamp(result.timestamp)}`);
    } catch (error) {
        console.error('截图失败:', error);
        showToast('截图失败: ' + error.message);
    }
}

/**
 * 处理添加笔记
 */
function handleAddNote() {
    const text = noteInput.value.trim();
    if (!text) {
        showToast('请输入笔记内容');
        return;
    }

    const entry = {
        id: Date.now(),
        timestamp: videoPlayer.currentTime || 0,
        text
    };

    noteEntries.push(entry);
    noteInput.value = '';

    renderNoteEntries();
    showToast('笔记已添加');
}

/**
 * 渲染笔记条目
 */
function renderNoteEntries() {
    if (noteEntries.length === 0) {
        noteEntriesContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.4); padding: 20px;">暂无笔记</p>';
        return;
    }

    // 按时间排序
    const sorted = [...noteEntries].sort((a, b) => a.timestamp - b.timestamp);

    noteEntriesContainer.innerHTML = sorted.map(entry => `
    <div class="note-entry" data-id="${entry.id}">
      <div class="note-entry-header">
        <span class="note-entry-time" data-time="${entry.timestamp}">
          ${formatTimestamp(entry.timestamp)}
        </span>
      </div>
      <div class="note-entry-content">
        ${entry.screenshot ? `<img src="${entry.screenshot}" class="note-entry-screenshot" alt="截图">` : ''}
        ${entry.text ? `<div class="note-entry-text">${escapeHtml(entry.text)}</div>` : ''}
      </div>
    </div>
  `).join('');

    // 绑定时间戳点击事件
    document.querySelectorAll('.note-entry-time').forEach(el => {
        el.addEventListener('click', () => {
            const time = parseFloat(el.dataset.time);
            videoPlayer.currentTime = time;
            videoPlayer.play();
        });
    });
}

/**
 * 导出笔记
 */
function handleExport() {
    if (noteEntries.length === 0) {
        showToast('暂无笔记可导出');
        return;
    }

    const note = {
        title: currentVideoFile?.name || '本地视频笔记',
        videoUrl: currentVideoFile ? `file:///${currentVideoFile.name}` : '',
        entries: noteEntries.map(entry => ({
            timestamp: entry.timestamp,
            screenshot: entry.screenshot,
            text: entry.text
        })),
        createdAt: Date.now()
    };

    const markdown = generateMarkdown(note);

    // 下载
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const filename = `${note.title.replace(/\.[^.]+$/, '')}_笔记.md`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    showToast('导出成功');
}

/**
 * 处理快捷键
 */
function handleKeydown(e) {
    // 不在输入框内时才响应
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
    }

    // 空格 - 播放/暂停
    if (e.code === 'Space') {
        e.preventDefault();
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    }

    // Alt+S - 截图
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        handleScreenshot();
    }

    // 左右箭头 - 快进/快退
    if (e.code === 'ArrowLeft') {
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 5);
    }
    if (e.code === 'ArrowRight') {
        videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 5);
    }
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
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
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

// 启动
init();
