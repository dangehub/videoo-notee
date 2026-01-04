/**
 * 视频模式（Focus Mode）
 * 提取原生视频播放器到全屏容器
 */

// Focus Mode 状态
let focusModeActive = false;
let focusContainer = null;
let originalPlayerInfo = null;

// 平台播放器选择器配置
const PLAYER_SELECTORS = {
    bilibili: [
        '.bpx-player-container',
        '#bilibili-player',
        '.bilibili-player-area'
    ],
    youtube: [
        '#movie_player',
        'ytd-player',
        '.html5-video-player'
    ],
    generic: [
        '[class*="player"]',
        '[class*="video-container"]',
        '[id*="player"]'
    ]
};

/**
 * 检测当前平台
 */
function detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('bilibili.com')) return 'bilibili';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('coursera.org')) return 'coursera';
    if (hostname.includes('udemy.com')) return 'udemy';
    return 'generic';
}

/**
 * 找到视频播放器容器
 */
function findPlayerContainer() {
    const platform = detectPlatform();
    const selectors = PLAYER_SELECTORS[platform] || PLAYER_SELECTORS.generic;

    // 首先尝试平台特定选择器
    for (const selector of selectors) {
        const player = document.querySelector(selector);
        if (player && isValidPlayer(player)) {
            console.log(`[Videoo Notee] 找到播放器: ${selector}`);
            return player;
        }
    }

    // 回退：找到包含 video 元素的最近合适容器
    const video = document.querySelector('video');
    if (video) {
        let container = video.parentElement;
        // 向上遍历找到合适的容器（有一定大小且不是 body）
        while (container && container !== document.body) {
            const rect = container.getBoundingClientRect();
            if (rect.width >= 300 && rect.height >= 200) {
                console.log(`[Videoo Notee] 使用 video 父容器`);
                return container;
            }
            container = container.parentElement;
        }
        // 如果找不到合适容器，直接返回 video
        return video;
    }

    return null;
}

/**
 * 验证播放器是否有效
 */
function isValidPlayer(element) {
    const rect = element.getBoundingClientRect();
    // 检查是否有足够大小且可见
    return rect.width >= 200 && rect.height >= 100 &&
        window.getComputedStyle(element).display !== 'none';
}

/**
 * 进入视频模式
 */
export function enterFocusMode() {
    if (focusModeActive) {
        console.log('[Videoo Notee] 已在视频模式中');
        return;
    }

    const player = findPlayerContainer();
    if (!player) {
        console.error('[Videoo Notee] 找不到视频播放器');
        return;
    }

    // 保存原始位置信息
    originalPlayerInfo = {
        element: player,
        parent: player.parentElement,
        nextSibling: player.nextSibling,
        originalStyles: {
            position: player.style.position,
            width: player.style.width,
            height: player.style.height,
            top: player.style.top,
            left: player.style.left,
            zIndex: player.style.zIndex
        }
    };

    // 创建全屏容器
    focusContainer = createFocusModeContainer();

    // 创建视频区域
    const videoArea = focusContainer.querySelector('.vn-focus-video-area');

    // 移动播放器到视频区域
    videoArea.appendChild(player);

    // 添加到页面
    document.body.appendChild(focusContainer);

    // 锁定滚动
    document.body.style.overflow = 'hidden';

    focusModeActive = true;
    console.log('[Videoo Notee] 进入视频模式');

    // 通知编辑器
    window.postMessage({ type: 'VN_FOCUS_MODE_ENTERED' }, '*');
}

/**
 * 退出视频模式
 */
export function exitFocusMode() {
    if (!focusModeActive || !originalPlayerInfo) {
        return;
    }

    const player = originalPlayerInfo.element;

    // 恢复播放器原始位置
    if (originalPlayerInfo.nextSibling) {
        originalPlayerInfo.parent.insertBefore(player, originalPlayerInfo.nextSibling);
    } else {
        originalPlayerInfo.parent.appendChild(player);
    }

    // 恢复原始样式
    const styles = originalPlayerInfo.originalStyles;
    player.style.position = styles.position;
    player.style.width = styles.width;
    player.style.height = styles.height;
    player.style.top = styles.top;
    player.style.left = styles.left;
    player.style.zIndex = styles.zIndex;

    // 移除全屏容器
    if (focusContainer) {
        focusContainer.remove();
        focusContainer = null;
    }

    // 恢复滚动
    document.body.style.overflow = '';

    originalPlayerInfo = null;
    focusModeActive = false;
    console.log('[Videoo Notee] 退出视频模式');

    // 通知编辑器
    window.postMessage({ type: 'VN_FOCUS_MODE_EXITED' }, '*');
}

/**
 * 切换视频模式
 */
export function toggleFocusMode() {
    if (focusModeActive) {
        exitFocusMode();
    } else {
        enterFocusMode();
    }
}

/**
 * 创建视频模式容器
 */
function createFocusModeContainer() {
    const container = document.createElement('div');
    container.className = 'vn-focus-mode-container';
    container.innerHTML = `
        <div class="vn-focus-controls">
            <button class="vn-focus-btn vn-focus-close" title="退出视频模式">✕</button>
            <div class="vn-focus-spacer"></div>
            <button class="vn-focus-btn vn-focus-speed-down" title="减速">🐢</button>
            <span class="vn-focus-speed-display">1.0x</span>
            <button class="vn-focus-btn vn-focus-speed-up" title="加速">⚡</button>
            <div class="vn-focus-spacer"></div>
            <button class="vn-focus-btn vn-focus-screenshot" title="截图">📸</button>
        </div>
        <div class="vn-focus-main">
            <div class="vn-focus-video-area"></div>
            <div class="vn-focus-gutter"></div>
            <div class="vn-focus-editor-area"></div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = getFocusModeStyles();
    container.appendChild(style);

    // 绑定事件
    bindFocusModeEvents(container);

    return container;
}

/**
 * 绑定视频模式事件
 */
function bindFocusModeEvents(container) {
    const closeBtn = container.querySelector('.vn-focus-close');
    const speedDownBtn = container.querySelector('.vn-focus-speed-down');
    const speedUpBtn = container.querySelector('.vn-focus-speed-up');
    const speedDisplay = container.querySelector('.vn-focus-speed-display');
    const screenshotBtn = container.querySelector('.vn-focus-screenshot');
    const gutter = container.querySelector('.vn-focus-gutter');
    const videoArea = container.querySelector('.vn-focus-video-area');
    const editorArea = container.querySelector('.vn-focus-editor-area');

    // 关闭按钮
    closeBtn.addEventListener('click', exitFocusMode);

    // 速度控制
    speedDownBtn.addEventListener('click', () => {
        const video = getVideoElement();
        if (video) {
            video.playbackRate = Math.max(0.25, video.playbackRate - 0.25);
            speedDisplay.textContent = video.playbackRate.toFixed(2) + 'x';
        }
    });

    speedUpBtn.addEventListener('click', () => {
        const video = getVideoElement();
        if (video) {
            video.playbackRate = Math.min(4, video.playbackRate + 0.25);
            speedDisplay.textContent = video.playbackRate.toFixed(2) + 'x';
        }
    });

    // 截图
    screenshotBtn.addEventListener('click', () => {
        window.postMessage({ type: 'VN_CAPTURE_SCREENSHOT' }, '*');
    });

    // 拖拽调整分栏
    let isResizing = false;
    gutter.addEventListener('mousedown', (e) => {
        isResizing = true;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const containerRect = container.getBoundingClientRect();
        const percent = (e.clientX - containerRect.left) / containerRect.width * 100;
        const clampedPercent = Math.min(80, Math.max(20, percent));
        videoArea.style.flex = `0 0 ${clampedPercent}%`;
        editorArea.style.flex = `0 0 ${100 - clampedPercent - 1}%`;
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
    });

    // ESC 键退出
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && focusModeActive) {
            exitFocusMode();
        }
    });
}

/**
 * 获取视频元素
 */
function getVideoElement() {
    if (focusContainer) {
        return focusContainer.querySelector('video');
    }
    return document.querySelector('video');
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

        .vn-focus-controls {
            display: flex !important;
            align-items: center !important;
            padding: 8px 16px !important;
            background: #1a1a2e !important;
            gap: 8px !important;
            border-bottom: 1px solid #313244 !important;
        }

        .vn-focus-btn {
            width: 36px !important;
            height: 36px !important;
            border: none !important;
            background: #313244 !important;
            color: #cdd6f4 !important;
            font-size: 16px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s !important;
        }

        .vn-focus-btn:hover {
            background: #45475a !important;
        }

        .vn-focus-close:hover {
            background: #f38ba8 !important;
            color: #1e1e2e !important;
        }

        .vn-focus-speed-display {
            color: #89b4fa !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            min-width: 50px !important;
            text-align: center !important;
        }

        .vn-focus-spacer {
            flex: 1 !important;
        }

        .vn-focus-main {
            flex: 1 !important;
            display: flex !important;
            min-height: 0 !important;
            padding: 16px !important;
            gap: 0 !important;
        }

        .vn-focus-video-area {
            flex: 0 0 60% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #000 !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            position: relative !important;
        }

        .vn-focus-video-area video,
        .vn-focus-video-area iframe {
            width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
        }

        /* B站播放器适配 */
        .vn-focus-video-area .bpx-player-container,
        .vn-focus-video-area #bilibili-player {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
        }

        .vn-focus-video-area .bpx-player-video-wrap {
            width: 100% !important;
            height: 100% !important;
        }

        /* YouTube 播放器适配 */
        .vn-focus-video-area #movie_player,
        .vn-focus-video-area .html5-video-player {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
        }

        .vn-focus-gutter {
            width: 8px !important;
            background: transparent !important;
            cursor: col-resize !important;
            transition: background 0.2s !important;
            margin: 0 4px !important;
        }

        .vn-focus-gutter:hover {
            background: rgba(137, 180, 250, 0.3) !important;
        }

        .vn-focus-editor-area {
            flex: 0 0 39% !important;
            background: #1e1e2e !important;
            border-radius: 12px !important;
            overflow: hidden !important;
        }
    `;
}

/**
 * 检查是否在视频模式中
 */
export function isFocusModeActive() {
    return focusModeActive;
}

export default {
    enterFocusMode,
    exitFocusMode,
    toggleFocusMode,
    isFocusModeActive
};
