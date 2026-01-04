/**
 * 截图缓存存储
 * 使用 IndexedDB 存储截图 Blob
 */

const DB_NAME = 'VideooNoteeDB';
const DB_VERSION = 1;
const STORE_NAME = 'screenshots';

let db = null;

/**
 * 初始化数据库
 */
export async function initDB() {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('videoUrl', 'videoUrl', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
    });
}

/**
 * 保存截图到 IndexedDB
 * @param {Object} screenshot - 截图数据
 * @returns {Promise<string>} - 截图 ID
 */
export async function saveScreenshotToCache(screenshot) {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const id = screenshot.id || `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const data = {
            id,
            blob: screenshot.blob,
            dataUrl: screenshot.dataUrl,
            timestamp: screenshot.timestamp,
            videoUrl: screenshot.videoUrl,
            videoTitle: screenshot.videoTitle,
            width: screenshot.width,
            height: screenshot.height,
            createdAt: Date.now()
        };

        const request = store.put(data);
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 从 IndexedDB 获取截图
 * @param {string} id - 截图 ID
 * @returns {Promise<Object|null>}
 */
export async function getScreenshotFromCache(id) {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 获取视频的所有截图
 * @param {string} videoUrl - 视频 URL（可选）
 * @returns {Promise<Object[]>}
 */
export async function getScreenshotsByVideo(videoUrl = null) {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const screenshots = [];

        let request;
        if (videoUrl) {
            const index = store.index('videoUrl');
            request = index.openCursor(IDBKeyRange.only(videoUrl));
        } else {
            request = store.openCursor();
        }

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                screenshots.push(cursor.value);
                cursor.continue();
            } else {
                // 按时间倒序
                screenshots.sort((a, b) => b.createdAt - a.createdAt);
                resolve(screenshots);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * 获取所有截图（限制数量）
 * @param {number} limit - 最大数量
 * @returns {Promise<Object[]>}
 */
export async function getAllScreenshots(limit = 50) {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const screenshots = [];
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                screenshots.push(cursor.value);
                cursor.continue();
            } else {
                // 按时间倒序并限制数量
                screenshots.sort((a, b) => b.createdAt - a.createdAt);
                resolve(screenshots.slice(0, limit));
            }
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * 删除截图
 * @param {string} id - 截图 ID
 */
export async function deleteScreenshot(id) {
    await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * 清理旧截图（保留最近 N 张）
 * @param {number} keep - 保留数量
 */
export async function cleanupOldScreenshots(keep = 100) {
    const all = await getAllScreenshots(1000);

    if (all.length <= keep) return;

    const toDelete = all.slice(keep);
    for (const ss of toDelete) {
        await deleteScreenshot(ss.id);
    }
}

/**
 * 将截图导出为文件并下载
 * @param {Object} screenshot - 截图对象
 * @param {string} filename - 文件名
 */
export function downloadScreenshotAsFile(screenshot, filename) {
    const blob = screenshot.blob || dataUrlToBlob(screenshot.dataUrl);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

/**
 * DataURL 转 Blob
 */
function dataUrlToBlob(dataUrl) {
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

export default {
    initDB,
    saveScreenshotToCache,
    getScreenshotFromCache,
    getScreenshotsByVideo,
    getAllScreenshots,
    deleteScreenshot,
    cleanupOldScreenshots,
    downloadScreenshotAsFile
};
