/**
 * 内容脚本主入口
 * 注入到视频网站页面
 */

import browser from '../lib/browser-polyfill.js';
import { captureVideoFrame } from '../lib/screenshot.js';
import { formatTimestamp, generateTimestampLink } from '../lib/timestamp.js';
import { YouTubeAdapter } from './platforms/youtube.js';
import { BilibiliAdapter } from './platforms/bilibili.js';
import { YouTubeSubtitleProvider } from '../lib/subtitle/youtube.js';
import { BilibiliSubtitleProvider } from '../lib/subtitle/bilibili.js';
import { subtitleManager } from '../lib/subtitle/interface.js';
import { createFloatingEditor, showEditor, hideEditor, toggleEditor, insertScreenshot } from './floating-editor.js';
import { enterFocusMode, exitFocusMode, toggleFocusMode, isFocusModeActive } from './focus-mode.js';

// 当前平台适配器
let currentAdapter = null;
// 浮动工具栏元素
let toolbar = null;

/**
 * 初始化内容脚本
 */
async function init() {
    console.log('[Videoo Notee] 内容脚本初始化...');

    // 检测平台并初始化适配器
    const url = window.location.href;

    if (YouTubeAdapter.match(url)) {
        currentAdapter = new YouTubeAdapter();
        subtitleManager.registerProvider('youtube', new YouTubeSubtitleProvider());
    } else if (BilibiliAdapter.match(url)) {
        currentAdapter = new BilibiliAdapter();
        subtitleManager.registerProvider('bilibili', new BilibiliSubtitleProvider());
    } else {
        console.log('[Videoo Notee] 未识别的平台');
        return;
    }

    await currentAdapter.init();

    // 创建浮动工具栏
    createToolbar();

    // 监听消息
    browser.runtime.onMessage.addListener(handleMessage);

    // 监听页面内消息
    window.addEventListener('message', handleWindowMessage);

    console.log('[Videoo Notee] 内容脚本初始化完成');
}

/**
 * 创建浮动工具栏
 */
function createToolbar() {
    if (toolbar) {
        toolbar.remove();
    }

    toolbar = document.createElement('div');
    toolbar.id = 'videoo-notee-toolbar';
    toolbar.innerHTML = `
    <button id="vn-screenshot" title="截图 (Alt+S)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    </button>
    <button id="vn-note" title="打开笔记 (Alt+N)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    </button>
    <button id="vn-focus" title="视频模式">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8"/>
        <path d="M12 17v4"/>
      </svg>
    </button>
    <button id="vn-subtitle" title="字幕">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M7 15h4"/>
        <path d="M13 15h4"/>
        <path d="M7 11h2"/>
        <path d="M13 11h4"/>
      </svg>
    </button>
  `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
    #videoo-notee-toolbar {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(0, 0, 0, 0.8);
      padding: 8px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }
    
    #videoo-notee-toolbar button {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: white;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    #videoo-notee-toolbar button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    #videoo-notee-toolbar button:active {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .vn-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999999;
      animation: vn-fadeIn 0.3s ease;
    }
    
    @keyframes vn-fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

    document.head.appendChild(style);
    document.body.appendChild(toolbar);

    // 绑定事件
    document.getElementById('vn-screenshot').addEventListener('click', handleScreenshot);
    document.getElementById('vn-note').addEventListener('click', handleOpenEditor);
    document.getElementById('vn-focus').addEventListener('click', handleFocusMode);
    document.getElementById('vn-subtitle').addEventListener('click', handleSubtitle);

    // 快捷键
    document.addEventListener('keydown', handleKeyboard);
}

/**
 * 处理截图
 */
async function handleScreenshot() {
    const video = currentAdapter?.getVideoElement();
    if (!video) {
        showToast('未找到视频元素');
        return;
    }

    try {
        const result = await captureVideoFrame(video);
        const videoInfo = currentAdapter.getVideoInfo();

        // 发送到后台保存
        await browser.runtime.sendMessage({
            type: 'SAVE_SCREENSHOT',
            data: {
                screenshot: result.dataUrl,
                timestamp: result.timestamp,
                videoUrl: videoInfo.url,
                videoTitle: videoInfo.title
            }
        });

        showToast(`已截图 ${formatTimestamp(result.timestamp)}`);
    } catch (error) {
        console.error('[Videoo Notee] 截图失败:', error);
        showToast('截图失败: ' + error.message);
    }
}

/**
 * 打开悬浮编辑器
 */
function handleOpenEditor() {
    showEditor();
}

/**
 * 进入视频模式
 */
function handleFocusMode() {
    if (isFocusModeActive()) {
        exitFocusMode();
    } else {
        enterFocusMode();
        // 延迟创建编辑器
        setTimeout(() => {
            showEditor();
        }, 100);
    }
}

/**
 * 处理字幕
 */
async function handleSubtitle() {
    const url = window.location.href;
    let provider = subtitleManager.detectProvider(url);

    if (!provider) {
        showToast('当前平台暂不支持字幕提取');
        return;
    }

    try {
        const subtitles = await provider.getAvailableSubtitles();

        if (subtitles.length === 0) {
            showToast('未找到可用字幕');
            return;
        }

        // 显示字幕选择菜单
        showSubtitleMenu(subtitles, provider);
    } catch (error) {
        console.error('[Videoo Notee] 获取字幕失败:', error);
        showToast('获取字幕失败');
    }
}

/**
 * 显示字幕菜单
 */
function showSubtitleMenu(subtitles, provider) {
    // 移除已有菜单
    const existing = document.getElementById('vn-subtitle-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'vn-subtitle-menu';
    menu.style.cssText = `
    position: fixed;
    bottom: 140px;
    right: 70px;
    background: rgba(0, 0, 0, 0.95);
    border-radius: 8px;
    padding: 8px 0;
    z-index: 9999999;
    min-width: 150px;
  `;

    subtitles.forEach(sub => {
        const item = document.createElement('div');
        item.style.cssText = `
      padding: 8px 16px;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    `;
        item.textContent = `${sub.label}${sub.isAuto ? ' (自动)' : ''}`;
        item.addEventListener('mouseover', () => item.style.background = 'rgba(255,255,255,0.1)');
        item.addEventListener('mouseout', () => item.style.background = 'transparent');
        item.addEventListener('click', async () => {
            menu.remove();
            const entries = await provider.getSubtitle(sub.id);
            const text = provider.toPlainText(entries);

            // 发送到侧边栏
            await browser.runtime.sendMessage({
                type: 'SUBTITLE_LOADED',
                data: { entries, text, language: sub.language }
            });

            showToast(`已加载字幕: ${sub.label}`);
        });
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // 点击外部关闭
    const closeHandler = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

/**
 * 打开侧边栏
 */
async function handleOpenSidebar() {
    await browser.runtime.sendMessage({
        type: 'OPEN_EDITOR',
        data: { mode: 'sidebar' }
    });
}

/**
 * 处理键盘快捷键
 */
function handleKeyboard(e) {
    // Alt+S 截图
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        handleScreenshot();
    }
    // Alt+N 添加笔记
    if (e.altKey && e.key === 'n') {
        e.preventDefault();
        handleOpenEditor();
    }
    // Alt+F 视频模式
    if (e.altKey && e.key === 'f') {
        e.preventDefault();
        handleFocusMode();
    }
}

/**
 * 处理页面内消息（来自悬浮编辑器和视频模式）
 */
async function handleWindowMessage(event) {
    if (event.source !== window) return;

    const { type, data } = event.data;

    switch (type) {
        case 'VN_CAPTURE_SCREENSHOT':
            await handleScreenshotAndInsert();
            break;

        case 'VN_GET_TIMESTAMP':
            const video = currentAdapter?.getVideoElement();
            const videoInfo = currentAdapter?.getVideoInfo() || {};
            if (video) {
                window.postMessage({
                    type: 'VN_TIMESTAMP_RESULT',
                    data: {
                        timestamp: video.currentTime,
                        videoUrl: videoInfo.url
                    }
                }, '*');
            }
            break;

        case 'VN_ENTER_FOCUS_MODE':
            enterFocusMode();
            break;

        case 'VN_EXIT_FOCUS_MODE':
            exitFocusMode();
            break;
    }
}

/**
 * 截图并自动插入到编辑器
 */
async function handleScreenshotAndInsert() {
    const video = currentAdapter?.getVideoElement();
    if (!video) {
        showToast('未找到视频元素');
        return;
    }

    try {
        const result = await captureVideoFrame(video);
        const videoInfo = currentAdapter.getVideoInfo();

        // 保存到后台缓存
        await browser.runtime.sendMessage({
            type: 'SAVE_SCREENSHOT',
            data: {
                screenshot: result.dataUrl,
                timestamp: result.timestamp,
                videoUrl: videoInfo.url,
                videoTitle: videoInfo.title
            }
        });

        // 自动插入到悬浮编辑器
        insertScreenshot(result.dataUrl, result.timestamp, videoInfo.url);

        showToast(`已截图 ${formatTimestamp(result.timestamp)}`);
    } catch (error) {
        console.error('[Videoo Notee] 截图失败:', error);
        showToast('截图失败: ' + error.message);
    }
}

/**
 * 处理来自后台的消息
 */
async function handleMessage(message, sender, sendResponse) {
    switch (message.type) {
        case 'OPEN_FLOATING_EDITOR':
            showEditor();
            sendResponse({ success: true });
            break;

        case 'CAPTURE_VIDEO_FRAME':
            const video = currentAdapter?.getVideoElement();
            if (video) {
                const result = await captureVideoFrame(video);
                sendResponse(result);
            } else {
                sendResponse({ error: '未找到视频元素' });
            }
            break;

        case 'GET_VIDEO_INFO':
            sendResponse(currentAdapter?.getVideoInfo() || {});
            break;

        case 'SEEK_TO':
            const vid = currentAdapter?.getVideoElement();
            if (vid && message.data.time !== undefined) {
                vid.currentTime = message.data.time;
                sendResponse({ success: true });
            } else {
                sendResponse({ error: '无法跳转' });
            }
            break;
    }

    return true;
}

/**
 * 显示提示
 */
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'vn-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// 启动
init();

