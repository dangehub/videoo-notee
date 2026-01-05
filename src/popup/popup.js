/**
 * Popup 弹出窗口脚本 (简化版)
 */

import browser from '../lib/browser-polyfill.js';

// DOM 元素
const btnOpenEditor = document.getElementById('btn-open-editor');
const btnOpenPlayer = document.getElementById('btn-open-player');
const btnSettings = document.getElementById('btn-settings');

/**
 * 初始化
 */
async function init() {
    btnOpenEditor.addEventListener('click', openFloatingEditor);
    btnOpenPlayer.addEventListener('click', openPlayer);
    btnSettings.addEventListener('click', openSettings);
}

/**
 * 打开悬浮编辑器（在当前视频页面）
 */
async function openFloatingEditor() {
    try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            alert('无法获取当前标签页');
            return;
        }

        // 发送消息到内容脚本，打开悬浮编辑器
        await browser.tabs.sendMessage(tab.id, {
            type: 'OPEN_FLOATING_EDITOR'
        });

        window.close();
    } catch (error) {
        console.error('打开编辑器失败:', error);
        alert('请在视频页面使用此功能');
    }
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
 * 打开设置页面
 */
async function openSettings() {
    await browser.tabs.create({
        url: browser.runtime.getURL('settings/index.html')
    });
    window.close();
}

// 启动
init();
