/**
 * Service Worker - 后台脚本
 * 处理扩展的核心逻辑和消息传递
 */

import browser from '../lib/browser-polyfill.js';

// 监听扩展安装事件
browser.browserAPI.runtime.onInstalled.addListener((details) => {
    console.log('[Videoo Notee] 扩展已安装', details.reason);

    if (details.reason === 'install') {
        // 首次安装，初始化默认设置
        initializeDefaultSettings();
    }
});

/**
 * 初始化默认设置
 */
async function initializeDefaultSettings() {
    const defaultSettings = {
        // AI 设置
        ai: {
            apiEndpoint: 'https://api.openai.com/v1',
            apiKey: '',
            model: 'gpt-4'
        },
        // 导出设置
        export: {
            defaultFormat: 'markdown',
            obsidianCompatible: true,
            includeTimestamps: true
        },
        // 编辑器设置
        editor: {
            defaultMode: 'sidebar', // 'sidebar' | 'standalone' | 'embedded'
            autoSave: true,
            autoSaveInterval: 30000 // 30秒
        },
        // 截图设置
        screenshot: {
            format: 'png',
            quality: 0.92
        }
    };

    await browser.storage.set({ settings: defaultSettings });
    console.log('[Videoo Notee] 默认设置已初始化');
}

/**
 * 消息处理器
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Videoo Notee] 收到消息:', message.type);

    handleMessage(message, sender)
        .then(sendResponse)
        .catch((error) => {
            console.error('[Videoo Notee] 消息处理错误:', error);
            sendResponse({ error: error.message });
        });

    // 返回 true 表示异步响应
    return true;
});

/**
 * 处理消息
 */
async function handleMessage(message, sender) {
    switch (message.type) {
        case 'GET_SETTINGS':
            return getSettings();

        case 'SAVE_SETTINGS':
            return saveSettings(message.data);

        case 'OPEN_EDITOR':
            return openEditor(message.data, sender);

        case 'SAVE_NOTE':
            return saveNote(message.data);

        case 'GET_NOTES':
            return getNotes(message.data);

        case 'EXPORT_NOTE':
            return exportNote(message.data);

        case 'CAPTURE_SCREENSHOT':
            return captureScreenshot(sender.tab);

        case 'SAVE_SCREENSHOT':
            return saveScreenshot(message.data, sender);

        case 'GET_CURRENT_VIDEO':
            return getCurrentVideo();

        case 'GET_SCREENSHOTS':
            return getScreenshots(message.data);

        case 'VN_FETCH_URL':
            return fetchUrl(message.data);

        default:
            throw new Error(`未知消息类型: ${message.type}`);
    }
}

/**
 * 获取设置
 */
async function getSettings() {
    const result = await browser.storage.get('settings');
    return result.settings || {};
}

/**
 * 保存设置
 */
async function saveSettings(settings) {
    await browser.storage.set({ settings });
    return { success: true };
}

/**
 * 打开编辑器
 */
async function openEditor(options = {}, sender = null) {
    const settings = await getSettings();
    const mode = options.mode || settings.editor?.defaultMode || 'sidebar';

    // 保存当前视频上下文
    if (options.videoUrl || options.videoTitle || options.timestamp !== undefined) {
        await browser.storage.set({
            currentVideo: {
                url: options.videoUrl || '',
                title: options.videoTitle || '',
                timestamp: options.timestamp || 0,
                tabId: sender?.tab?.id || null,
                updatedAt: Date.now()
            }
        });
    }

    if (mode === 'sidebar') {
        // 尝试打开侧边栏
        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (browser.browserAPI.sidePanel) {
                await browser.browserAPI.sidePanel.open({ tabId: tab.id });
            } else {
                // 浏览器不支持侧边栏，回退到新标签页
                await browser.tabs.create({
                    url: browser.runtime.getURL('editor/index.html')
                });
            }
        } catch (error) {
            console.error('[Videoo Notee] 打开侧边栏失败:', error);
            // 回退到新标签页
            await browser.tabs.create({
                url: browser.runtime.getURL('editor/index.html')
            });
        }
    } else {
        // 打开独立标签页
        await browser.tabs.create({
            url: browser.runtime.getURL('editor/index.html')
        });
    }

    return { success: true };
}

/**
 * 保存笔记到存储
 */
async function saveNote(noteData) {
    const result = await browser.storage.get('notes');
    const notes = result.notes || {};

    const noteId = noteData.id || `note_${Date.now()}`;
    notes[noteId] = {
        ...noteData,
        id: noteId,
        updatedAt: Date.now()
    };

    await browser.storage.set({ notes });
    return { success: true, noteId };
}

/**
 * 获取笔记列表
 */
async function getNotes(filter = {}) {
    const result = await browser.storage.get('notes');
    const notes = result.notes || {};

    let noteList = Object.values(notes);

    // 按视频 URL 过滤
    if (filter.videoUrl) {
        noteList = noteList.filter(note => note.videoUrl === filter.videoUrl);
    }

    // 按时间排序
    noteList.sort((a, b) => b.updatedAt - a.updatedAt);

    return noteList;
}

/**
 * 导出笔记为 Markdown
 */
async function exportNote(options) {
    const { noteId, filename } = options;

    const result = await browser.storage.get('notes');
    const notes = result.notes || {};
    const note = notes[noteId];

    if (!note) {
        throw new Error('笔记不存在');
    }

    // 生成 Markdown 内容
    const markdown = generateMarkdown(note);

    // 创建 Blob 并下载
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    await browser.downloads.download({
        url,
        filename: filename || `${note.title || 'note'}.md`,
        saveAs: true
    });

    return { success: true };
}

/**
 * 生成 Markdown 内容
 */
function generateMarkdown(note) {
    const settings = getSettings();
    const obsidianCompatible = settings.export?.obsidianCompatible ?? true;

    let md = `# ${note.title || '视频笔记'}\n\n`;

    if (note.videoUrl) {
        md += `> 视频链接: ${note.videoUrl}\n\n`;
    }

    if (note.content) {
        md += note.content + '\n\n';
    }

    // 添加截图和时间戳
    if (note.entries && note.entries.length > 0) {
        md += '## 笔记内容\n\n';

        for (const entry of note.entries) {
            if (entry.timestamp !== undefined) {
                const timeStr = formatTimestamp(entry.timestamp);
                const timeLink = note.videoUrl
                    ? `[${timeStr}](${note.videoUrl}&t=${Math.floor(entry.timestamp)})`
                    : timeStr;
                md += `### ${timeLink}\n\n`;
            }

            if (entry.screenshot) {
                md += `![截图](${entry.screenshot})\n\n`;
            }

            if (entry.text) {
                md += entry.text + '\n\n';
            }
        }
    }

    return md;
}

/**
 * 格式化时间戳
 */
function formatTimestamp(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * 截图当前标签页
 */
async function captureScreenshot(tab) {
    if (!tab) {
        throw new Error('无法获取当前标签页');
    }

    // 向内容脚本发送截图请求
    const response = await browser.tabs.sendMessage(tab.id, {
        type: 'CAPTURE_VIDEO_FRAME'
    });

    return response;
}

/**
 * 保存截图到缓存
 */
async function saveScreenshot(data, sender) {
    const result = await browser.storage.get('screenshots');
    const screenshots = result.screenshots || [];

    // 生成唯一 ID 和文件名
    const timestamp = data.timestamp || 0;
    const videoTitle = (data.videoTitle || 'screenshot')
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 50);

    const h = Math.floor(timestamp / 3600);
    const m = Math.floor((timestamp % 3600) / 60);
    const s = Math.floor(timestamp % 60);
    const timeStr = h > 0
        ? `${h}-${m.toString().padStart(2, '0')}-${s.toString().padStart(2, '0')}`
        : `${m}-${s.toString().padStart(2, '0')}`;

    const id = `ss_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const filename = `${videoTitle}_${timeStr}.jpg`;

    // 只缓存截图数据，不下载文件
    const screenshot = {
        id,
        filename,
        dataUrl: data.screenshot,
        timestamp: data.timestamp,
        videoUrl: data.videoUrl,
        videoTitle: data.videoTitle,
        tabId: sender?.tab?.id || null,
        createdAt: Date.now()
    };

    screenshots.push(screenshot);

    // 限制存储的截图数量
    while (screenshots.length > 50) {
        screenshots.shift();
    }

    await browser.storage.set({ screenshots });

    // 更新当前视频上下文
    await browser.storage.set({
        currentVideo: {
            url: data.videoUrl || '',
            title: data.videoTitle || '',
            tabId: sender?.tab?.id || null,
            updatedAt: Date.now()
        }
    });

    console.log('[Videoo Notee] 截图已缓存:', screenshot.id);

    return { success: true, screenshotId: screenshot.id, filename: screenshot.filename };
}

/**
 * 获取截图列表
 */
async function getScreenshots(filter = {}) {
    const result = await browser.storage.get('screenshots');
    let screenshots = result.screenshots || [];

    // 按视频 URL 过滤
    if (filter.videoUrl) {
        screenshots = screenshots.filter(ss => ss.videoUrl === filter.videoUrl);
    }

    // 按时间排序（最新的在前）
    screenshots.sort((a, b) => b.createdAt - a.createdAt);

    return screenshots;
}

/**
 * 获取当前视频上下文
 */
async function getCurrentVideo() {
    const result = await browser.storage.get('currentVideo');
    return result.currentVideo || null;
}

/**
 * 代理获取 URL 内容 (用于绕过 CSP/CORS)
 */
async function fetchUrl(options) {
    const { url } = options;
    if (!url) throw new Error('URL is required');

    console.log('[Videoo Notee] Background fetching:', url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        }
        // 目前只处理 JSON，后续可根据 content-type 扩展
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('[Videoo Notee] Background fetch error:', error);
        return { success: false, error: error.message };
    }
}

console.log('[Videoo Notee] Service Worker 已启动');
