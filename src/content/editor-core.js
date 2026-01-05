/**
 * 编辑器核心组件
 * 提供属性区、正文区、保存等功能，供悬浮编辑器和全屏模式复用
 */

import {
    saveNote as saveNoteToLocal,
    saveScreenshot as saveScreenshotToLocal,
    getDirectoryName,
    getAssetsFolder,
    readResource
} from '../lib/local-storage.js';
import { extractPropertiesAsArray, propertiesToFrontmatter } from '../utils/clipper-bridge.js';

// 编辑器实例存储
let editorInstances = new Map();

/**
 * 创建编辑器核心内容（属性区 + 正文区）
 * @param {string} instanceId - 实例ID（用于区分多个编辑器）
 * @returns {HTMLElement} 编辑器内容容器
 */
export function createEditorContent(instanceId = 'default') {
    const container = document.createElement('div');
    container.className = 'vn-editor-core';
    container.innerHTML = `
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
    `;

    // 创建实例数据
    const instance = {
        id: instanceId,
        container,
        liveEditor: container.querySelector('.vn-live-editor'),
        propertiesSection: container.querySelector('.vn-properties-section'),
        propertiesList: container.querySelector('.vn-properties-list'),
        properties: [],
        isPropertiesCollapsed: false
    };

    editorInstances.set(instanceId, instance);
    return container;
}

/**
 * 获取编辑器实例
 */
export function getEditorInstance(instanceId) {
    return editorInstances.get(instanceId);
}

/**
 * 初始化编辑器核心逻辑
 */
export async function initEditorCore(instanceId, initialTitle) {
    const instance = editorInstances.get(instanceId);
    if (!instance) return;

    // 初始化属性区
    await initPropertiesSection(instance, initialTitle);

    // 绑定编辑器输入事件（比如自动高度等，如果需要）
    // 目前主要是样式控制
}

/**
 * 初始化属性部分
 */
export async function initPropertiesSection(instance) {
    const { propertiesSection } = instance;
    const header = propertiesSection.querySelector('.vn-properties-header');
    const toggle = propertiesSection.querySelector('.vn-properties-toggle');
    const addBtn = propertiesSection.querySelector('.vn-add-property-btn');

    // 1. 初始化默认属性 (如果未设置)
    if (!instance.properties || instance.properties.length === 0) {
        // TODO: 未来需支持在设置中自定义默认属性模板
        instance.properties = extractPropertiesAsArray();
    }
    renderPropertiesList(instance);

    // 2. 处理折叠状态 (从 Storage读取)
    let isCollapsed = false;
    try {
        const stored = await chrome.storage.local.get('propertiesCollapsed');
        isCollapsed = stored.propertiesCollapsed || false;
    } catch (e) {
        // 忽略错误
    }

    if (isCollapsed) {
        propertiesSection.classList.add('collapsed');
        if (toggle) toggle.textContent = '▶';
    }

    // 绑定折叠事件
    header.addEventListener('click', async () => {
        const collapsed = propertiesSection.classList.toggle('collapsed');
        if (toggle) toggle.textContent = collapsed ? '▶' : '▼';

        try {
            await chrome.storage.local.set({ propertiesCollapsed: collapsed });
        } catch (e) { }
    });

    // 3. 添加属性按钮事件
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        instance.properties.push({ key: '', value: '' });
        renderPropertiesList(instance);

        // 聚焦到新输入框
        const list = propertiesSection.querySelector('.vn-properties-list');
        const inputs = list.querySelectorAll('.vn-property-key');
        if (inputs.length > 0) {
            inputs[inputs.length - 1].focus();
        }
    });
}

/**
 * 渲染属性列表（双栏模式）
 */
export function renderPropertiesList(instance) {
    const { propertiesList, properties } = instance;

    propertiesList.innerHTML = properties.map((prop, index) => `
        <div class="vn-property-row" data-index="${index}">
            <input type="text" class="vn-property-key" value="${escapeHtml(prop.key)}" placeholder="键">
            <input type="text" class="vn-property-value" value="${escapeHtml(prop.value)}" placeholder="值">
            <button class="vn-property-delete" title="删除">×</button>
        </div>
    `).join('');

    // 绑定事件
    propertiesList.querySelectorAll('.vn-property-row').forEach((row, index) => {
        const keyInput = row.querySelector('.vn-property-key');
        const valueInput = row.querySelector('.vn-property-value');
        const deleteBtn = row.querySelector('.vn-property-delete');

        keyInput.addEventListener('input', () => {
            instance.properties[index].key = keyInput.value;
        });

        valueInput.addEventListener('input', () => {
            instance.properties[index].value = valueInput.value;
        });

        deleteBtn.addEventListener('click', () => {
            instance.properties.splice(index, 1);
            renderPropertiesList(instance);
        });

        // 阻止键盘事件冒泡
        keyInput.addEventListener('keydown', e => e.stopPropagation());
        valueInput.addEventListener('keydown', e => e.stopPropagation());
    });
}



/**
 * 获取编辑器完整内容（包括 Frontmatter）
 */
export function getEditorContent(instanceId) {
    const instance = editorInstances.get(instanceId);
    if (!instance) return '';

    // 生成 Frontmatter
    const frontmatter = propertiesToFrontmatter(instance.properties);

    // 获取正文并转为 Markdown
    const body = htmlToMarkdown(instance.liveEditor.innerHTML);

    return frontmatter + body;
}

/**
 * 保存笔记
 */
export async function saveNote(instanceId, title) {
    const content = getEditorContent(instanceId);
    if (!content) return;

    try {
        await saveNoteToLocal(title, content);
        console.log(`[EditorCore] 笔记已保存: ${title}`);

        // 可选：显示保存成功提示
        // showToast('已保存'); // 需要引入或传入 showToast
    } catch (e) {
        console.error('[EditorCore] 保存失败:', e);
        throw e;
    }
}

/**
 * 插入时间戳链接
 */
export function insertTimestamp(instanceId, timestamp, videoUrl) {
    const instance = editorInstances.get(instanceId);
    if (!instance) return;

    const timeStr = formatTimestamp(timestamp);
    const timestampUrl = generateTimestampLink(videoUrl, timestamp);
    const linkHtml = `<a href="${timestampUrl}" class="vn-timestamp-link">${timeStr}</a>&nbsp;`;

    insertHtmlAtCursor(instance.liveEditor, linkHtml);
}

/**
 * 插入截图
 */
export async function insertScreenshot(instanceId, dataUrl, timestamp, videoUrl) {
    const instance = editorInstances.get(instanceId);
    if (!instance) return;

    const timeStr = formatTimestamp(timestamp);
    const timestampUrl = generateTimestampLink(videoUrl, timestamp);

    // 保存截图到文件系统
    const filename = `screenshot_${Date.now()}.png`;
    let savedPath = filename;

    try {
        const result = await saveScreenshotToLocal(dataUrl, filename);
        if (result) savedPath = result;
    } catch (e) {
        console.error('[EditorCore] 截图保存失败:', e);
    }

    const imgHtml = `
        <div class="vn-screenshot-block">
            <img src="${dataUrl}" alt="Screenshot at ${timeStr}" data-saved-path="${savedPath}">
            <div class="vn-screenshot-time">
                <a href="${timestampUrl}" class="vn-timestamp-link">${timeStr}</a>
            </div>
        </div>
        <br>
    `;

    insertHtmlAtCursor(instance.liveEditor, imgHtml);
}

/**
 * 加载编辑器中的本地图片
 * @param {string} instanceId 
 */
export async function loadEditorImages(instanceId = 'default') {
    const instance = editorInstances.get(instanceId);
    if (!instance) return;

    const images = instance.liveEditor.querySelectorAll('img');
    for (const img of images) {
        const src = img.getAttribute('data-saved-path') || img.getAttribute('src');
        // 检查是否是本地路径（不包含 http/https/blob/data）
        if (src && !src.match(/^(http|https|blob|data):/)) {
            try {
                const blob = await readResource(src);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    img.src = url;
                    // 保持 data-saved-path 不变
                    if (!img.getAttribute('data-saved-path')) {
                        img.setAttribute('data-saved-path', src);
                    }
                }
            } catch (err) {
                console.warn('[EditorCore] 无法加载图片资源:', src);
            }
        }
    }
}

/**
 * 销毁编辑器实例
 */
export function destroyEditorInstance(instanceId = 'default') {
    editorInstances.delete(instanceId);
}

// ========== 工具函数 ==========

/**
 * 解析 Frontmatter 和正文
 */
export function parseFrontmatter(content) {
    const properties = [];
    let body = content;

    // 匹配 YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (match) {
        const yaml = match[1];
        body = match[2];

        // 简单的 YAML 解析
        const lines = yaml.split('\n');
        let currentKey = null;

        for (const line of lines) {
            const propMatch = line.match(/^([^:]+):\s*(.*)$/);
            if (propMatch) {
                const key = propMatch[1].trim();
                let value = propMatch[2].trim();

                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1).replace(/\\"/g, '"');
                }

                if (!value && lines.indexOf(line) < lines.length - 1) {
                    currentKey = key;
                    value = '';
                } else {
                    currentKey = null;
                }

                properties.push({ key, value });
            } else if (currentKey && line.trim().startsWith('- ')) {
                const val = line.trim().substring(2);
                const lastProp = properties[properties.length - 1];
                if (lastProp && lastProp.key === currentKey) {
                    lastProp.value = lastProp.value ? `${lastProp.value}, ${val}` : val;
                }
            }
        }
    }

    return { properties, body };
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatTimestamp(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function generateTimestampLink(videoUrl, timestamp) {
    const url = new URL(videoUrl);
    if (url.hostname.includes('youtube')) {
        url.searchParams.set('t', Math.floor(timestamp) + 's');
    } else if (url.hostname.includes('bilibili')) {
        url.searchParams.set('t', Math.floor(timestamp));
    }
    return url.toString();
}

function generateNoteTitle() {
    const videoTitle = document.title.replace(/[-_|].*/g, '').trim().slice(0, 30);
    const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
    return `${videoTitle}_${date}`;
}

/**
 * Markdown 转 HTML (用于加载笔记)
 */
export function markdownToHtml(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // 保护代码块
    const codeBlocks = [];
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
        codeBlocks.push(code);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 恢复截图块 HTML
    const screenshotRegex = /!\[(.*?)\]\((.*?)\)\s*(?:\[(.*?)\]\((.*?)\))?/g;
    html = html.replace(screenshotRegex, (match, alt, src, timeText, timeHref) => {
        const isScreenshot = alt.includes('截图') || src.includes('assets/');
        if (isScreenshot) {
            let linkHtml = '';
            if (timeText && timeHref) {
                linkHtml = `<a href="${timeHref}" class="vn-timestamp-link">${timeText}</a>`;
            }
            // 使用 data-saved-path 确保图片路径正确
            return `<div class="vn-screenshot-block"><img src="${src}" alt="${alt}" data-saved-path="${src}">${linkHtml}</div><br>`;
        }
        return `<img src="${src}" alt="${alt}">`;
    });

    // 普通链接（识别时间戳链接）
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, href) => {
        // 匹配时间戳格式：14:17, 01:23:45
        const isTimestamp = /^(\d{1,2}:\d{2}(?::\d{2})?)$/.test(text.trim());
        if (isTimestamp) {
            return `<a href="${href}" class="vn-timestamp-link">${text}</a>`;
        }
        return `<a href="${href}">${text}</a>`;
    });

    // 标题
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // 样式
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

    // 换行
    html = html.replace(/\n/g, '<br>');

    // 恢复代码块
    html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
        return `<pre><code>${codeBlocks[index]}</code></pre>`;
    });

    return html;
}

export function htmlToMarkdown(html) {
    return html
        .replace(/<div class="vn-screenshot-block">([\s\S]*?)<\/div>/gi, (match, content) => {
            // 提取图片和时间戳
            const imgTagMatch = content.match(/<img[^>]+>/i);
            const timeMatch = content.match(/<a[^>]+href="([^"]*)"[^>]*>([^<]*)<\/a>/i);

            let md = '';
            if (imgTagMatch) {
                const imgTag = imgTagMatch[0];
                // 独立匹配属性，不依赖顺序
                const srcMatch = imgTag.match(/src="([^"]*)"/i);
                const savedPathMatch = imgTag.match(/data-saved-path="([^"]*)"/i);

                // 优先使用 saved-path，否则使用 src
                const src = (savedPathMatch && savedPathMatch[1]) ? savedPathMatch[1] : (srcMatch ? srcMatch[1] : '');
                if (src) {
                    md += `![](${src})\n`;
                }
            }
            if (timeMatch) {
                md += `[${timeMatch[2]}](${timeMatch[1]})\n`;
            }
            return md + '\n';
        })
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n') // div 视为换行
        .replace(/<\/div>/gi, '')
        .replace(/<p[^>]*>/gi, '\n') // p 视为换行
        .replace(/<\/p>/gi, '')
        .replace(/<a[^>]+href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
        // 普通图片处理（非截图块）
        .replace(/<img[^>]+>/gi, (match) => {
            const srcMatch = match.match(/src="([^"]*)"/i);
            const savedPathMatch = match.match(/data-saved-path="([^"]*)"/i);
            const src = (savedPathMatch && savedPathMatch[1]) ? savedPathMatch[1] : (srcMatch ? srcMatch[1] : '');
            return src ? `![](${src})` : '';
        })
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n[ \t]+/g, '\n') // 去除行首空格/制表符，保留换行
        .trim(); // 去除首尾空白
}

function insertHtmlAtCursor(editor, html) {
    editor.focus();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const fragment = range.createContextualFragment(html);
    const lastNode = fragment.lastChild;

    range.insertNode(fragment);

    if (lastNode) {
        range.setStartAfter(lastNode);
        range.setEndAfter(lastNode);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * 配置自动保存
 * @param {object} instance - 编辑器实例
 * @param {function} saveCallback - 保存回调函数
 * @param {number} delay - 延迟时间 (ms), 默认 1000
 */
export function setupAutoSave(instance, saveCallback, delay = 1000) {
    let timeoutId = null;

    const debouncedSave = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            saveCallback();
        }, delay);
    };

    // 监听正文输入
    if (instance.liveEditor) {
        instance.liveEditor.addEventListener('input', debouncedSave);
        instance.liveEditor.addEventListener('compositionend', debouncedSave);
    }

    // 监听属性区输入
    if (instance.propertiesSection) {
        // 使用 capture 或让其冒泡
        instance.propertiesSection.addEventListener('input', debouncedSave);
    }
}

/**
 * 获取编辑器核心样式
 */
export function getEditorCoreStyles() {
    return `
        .vn-editor-core {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            background: #1e1e2e;
        }

        /* 属性区 */
        .vn-properties-section {
            background: #181825;
            border-bottom: 1px solid #313244;
        }

        .vn-properties-section.collapsed .vn-properties-body {
            display: none !important;
        }

        .vn-properties-header {
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            user-select: none;
            color: #a6adc8;
            font-size: 13px;
        }

        .vn-properties-header:hover {
            color: #cdd6f4;
        }

        .vn-properties-toggle {
            transition: transform 0.2s;
            font-size: 10px;
        }

        .vn-properties-body {
            padding: 8px 16px;
            border-top: 1px solid #313244;
        }

        .vn-property-row {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }

        .vn-property-key {
            width: 80px;
            background: #313244;
            border: 1px solid #45475a;
            color: #89b4fa;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }

        .vn-property-value {
            flex: 1;
            background: #313244;
            border: 1px solid #45475a;
            color: #cdd6f4;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }

        .vn-property-delete {
            background: transparent;
            border: none;
            color: #6c7086;
            cursor: pointer;
            padding: 0 4px;
            font-size: 16px;
        }

        .vn-property-delete:hover {
            color: #f38ba8;
        }

        .vn-add-property-btn {
            background: transparent;
            border: 1px dashed #45475a;
            color: #6c7086;
            width: 100%;
            padding: 4px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-top: 4px;
        }

        .vn-add-property-btn:hover {
            border-color: #89b4fa;
            color: #89b4fa;
        }

        /* 正文区 */
        .vn-body-section {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            min-height: 0;
        }

        .vn-live-editor {
            outline: none;
            color: #cdd6f4;
            line-height: 1.6;
            font-size: 14px;
            min-height: 100%;
        }

        .vn-live-editor:empty:before {
            content: attr(placeholder);
            color: #6c7086;
        }

        /* 截图块样式 */
        .vn-screenshot-block {
            display: inline-block;
            margin: 10px 0;
            border: 1px solid #313244;
            border-radius: 6px;
            overflow: hidden;
            background: #181825;
            max-width: 100%;
        }

        .vn-screenshot-block img {
            max-width: 100%;
            display: block;
        }

        .vn-screenshot-time {
            padding: 4px 8px;
            background: #11111b;
            font-size: 12px;
            border-top: 1px solid #313244;
        }

        .vn-timestamp-link {
            color: #89b4fa;
            text-decoration: none;
            cursor: pointer;
        }

        .vn-timestamp-link:hover {
            text-decoration: underline;
        }

        /* 通用链接样式 */
        a {
            color: #89b4fa;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }
    `;
}
