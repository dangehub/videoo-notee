/**
 * 设置页面脚本
 */

import browser from '../lib/browser-polyfill.js';

// DOM 元素
const aiProvider = document.getElementById('ai-provider');
const aiApiKey = document.getElementById('ai-api-key');
const aiBaseUrl = document.getElementById('ai-base-url');
const currentDirectory = document.getElementById('current-directory');
const btnChangeDirectory = document.getElementById('btn-change-directory');
const assetsFolder = document.getElementById('assets-folder');
const btnSave = document.getElementById('btn-save');

/**
 * 初始化
 */
async function init() {
    await loadSettings();
    bindEvents();
}

/**
 * 加载设置
 */
async function loadSettings() {
    try {
        const result = await browser.storage.local.get([
            'aiSettings',
            'fileSystemConfig'
        ]);

        // AI 设置
        if (result.aiSettings) {
            aiProvider.value = result.aiSettings.provider || 'openai';
            aiApiKey.value = result.aiSettings.apiKey || '';
            aiBaseUrl.value = result.aiSettings.baseUrl || '';
        }

        // 存储设置
        if (result.fileSystemConfig) {
            assetsFolder.value = result.fileSystemConfig.assetsFolder || 'assets';
        }

        // 获取当前目录名（通过后台）
        try {
            const dirInfo = await browser.runtime.sendMessage({
                type: 'GET_DIRECTORY_INFO'
            });
            if (dirInfo && dirInfo.name) {
                currentDirectory.textContent = dirInfo.name;
            }
        } catch (e) {
            console.log('无法获取目录信息');
        }
    } catch (error) {
        console.error('加载设置失败:', error);
    }
}

/**
 * 绑定事件
 */
function bindEvents() {
    btnSave.addEventListener('click', saveSettings);

    btnChangeDirectory.addEventListener('click', async () => {
        // 发送消息到后台请求更换目录
        try {
            await browser.runtime.sendMessage({
                type: 'REQUEST_DIRECTORY_CHANGE'
            });
            showToast('请在视频页面中选择新目录');
        } catch (error) {
            console.error('请求更换目录失败:', error);
        }
    });
}

/**
 * 保存设置
 */
async function saveSettings() {
    try {
        // AI 设置
        await browser.storage.local.set({
            aiSettings: {
                provider: aiProvider.value,
                apiKey: aiApiKey.value,
                baseUrl: aiBaseUrl.value
            }
        });

        // 存储配置
        await browser.storage.local.set({
            fileSystemConfig: {
                assetsFolder: assetsFolder.value || 'assets'
            }
        });

        showToast('设置已保存');
    } catch (error) {
        console.error('保存设置失败:', error);
        showToast('保存失败，请重试');
    }
}

/**
 * 显示提示
 */
function showToast(message) {
    // 移除已有的 toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(102, 126, 234, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 启动
init();
