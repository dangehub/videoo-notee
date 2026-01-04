/**
 * 截图工具
 * 从视频元素捕获帧
 */

/**
 * 从视频元素截图
 * @param {HTMLVideoElement} videoElement - 视频元素
 * @param {Object} options - 选项
 * @param {string} options.format - 图片格式 'png' | 'jpeg' | 'webp'
 * @param {number} options.quality - 质量 0-1
 * @returns {Promise<{dataUrl: string, blob: Blob, width: number, height: number, timestamp: number}>}
 */
export async function captureVideoFrame(videoElement, options = {}) {
    const {
        format = 'jpeg',  // 默认使用 JPEG
        quality = 0.85
    } = options;

    if (!videoElement || !(videoElement instanceof HTMLVideoElement)) {
        throw new Error('无效的视频元素');
    }

    if (videoElement.readyState < 2) {
        throw new Error('视频尚未加载');
    }

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    const timestamp = videoElement.currentTime;

    // 创建 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, width, height);

    // 获取图片数据
    const mimeType = `image/${format}`;
    const dataUrl = canvas.toDataURL(mimeType, quality);

    // 转换为 Blob
    const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, mimeType, quality);
    });

    return {
        dataUrl,
        blob,
        width,
        height,
        timestamp,
        format
    };
}

/**
 * 生成截图文件名
 * @param {string} videoTitle - 视频标题
 * @param {number} timestamp - 时间戳（秒）
 * @param {string} format - 图片格式
 * @returns {string}
 */
export function generateScreenshotFilename(videoTitle, timestamp, format = 'jpg') {
    // 清理视频标题
    let title = (videoTitle || 'screenshot')
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 50);

    // 格式化时间戳
    const h = Math.floor(timestamp / 3600);
    const m = Math.floor((timestamp % 3600) / 60);
    const s = Math.floor(timestamp % 60);
    const timeStr = h > 0
        ? `${h}-${m.toString().padStart(2, '0')}-${s.toString().padStart(2, '0')}`
        : `${m}-${s.toString().padStart(2, '0')}`;

    return `${title}_${timeStr}.${format}`;
}

/**
 * 将 DataURL 转换为 Blob
 * @param {string} dataUrl - Data URL
 * @returns {Blob}
 */
export function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const binary = atob(base64);
    const array = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }

    return new Blob([array], { type: mimeType });
}

/**
 * 将 Blob 转换为 DataURL
 * @param {Blob} blob - Blob 对象
 * @returns {Promise<string>}
 */
export function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * 下载截图
 * @param {string} dataUrl - 图片 Data URL
 * @param {string} filename - 文件名
 */
export function downloadScreenshot(dataUrl, filename = 'screenshot.jpg') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
}

export default {
    captureVideoFrame,
    generateScreenshotFilename,
    dataUrlToBlob,
    blobToDataUrl,
    downloadScreenshot
};
