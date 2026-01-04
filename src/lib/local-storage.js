/**
 * 本地文件系统存储模块
 * 使用 File System Access API 将笔记和截图保存到本地目录
 */

// 存储目录句柄
let rootDirHandle = null;
let assetsDirHandle = null;

// 默认配置
const DEFAULT_CONFIG = {
    assetsFolder: 'assets'
};

/**
 * 初始化文件系统
 * 检查是否已有保存的目录权限
 */
export async function initFileSystem() {
    try {
        // 尝试从 IndexedDB 恢复目录句柄
        const savedHandle = await getSavedDirectoryHandle();
        if (savedHandle) {
            // 验证权限
            const permission = await savedHandle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
                rootDirHandle = savedHandle;
                await ensureAssetsFolder();
                console.log('[Videoo Notee] 已恢复保存目录权限');
                return true;
            }
        }
    } catch (error) {
        console.log('[Videoo Notee] 无法恢复目录权限:', error);
    }
    return false;
}

/**
 * 请求用户选择保存目录
 */
export async function requestDirectoryAccess() {
    try {
        // 使用 File System Access API 选择目录
        rootDirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });

        // 保存目录句柄到 IndexedDB
        await saveDirectoryHandle(rootDirHandle);

        // 确保 assets 文件夹存在
        await ensureAssetsFolder();

        console.log('[Videoo Notee] 已选择保存目录:', rootDirHandle.name);
        return true;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('[Videoo Notee] 用户取消选择目录');
            return false;
        }
        console.error('[Videoo Notee] 选择目录失败:', error);
        throw error;
    }
}

/**
 * 确保 assets 文件夹存在
 */
async function ensureAssetsFolder() {
    if (!rootDirHandle) return;

    try {
        // 获取或创建 assets 文件夹
        const config = await getConfig();
        assetsDirHandle = await rootDirHandle.getDirectoryHandle(
            config.assetsFolder || DEFAULT_CONFIG.assetsFolder,
            { create: true }
        );
        console.log('[Videoo Notee] Assets 文件夹已就绪');
    } catch (error) {
        console.error('[Videoo Notee] 创建 assets 文件夹失败:', error);
    }
}

/**
 * 保存笔记到本地
 * @param {string} filename - 文件名（不含扩展名）
 * @param {string} content - Markdown 内容
 */
export async function saveNote(filename, content) {
    if (!rootDirHandle) {
        throw new Error('请先选择保存目录');
    }

    try {
        // 创建或覆盖文件
        const safeFilename = sanitizeFilename(filename) + '.md';
        const fileHandle = await rootDirHandle.getFileHandle(safeFilename, { create: true });

        // 写入内容
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        console.log('[Videoo Notee] 笔记已保存:', safeFilename);
        return safeFilename;
    } catch (error) {
        console.error('[Videoo Notee] 保存笔记失败:', error);
        throw error;
    }
}

/**
 * 保存截图到本地
 * @param {string} dataUrl - 图片的 Data URL
 * @param {string} filename - 文件名（不含扩展名）
 * @returns {string} 保存的文件路径（相对路径）
 */
export async function saveScreenshot(dataUrl, filename) {
    if (!assetsDirHandle) {
        throw new Error('请先选择保存目录');
    }

    try {
        // 将 data URL 转换为 Blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        // 确定文件扩展名
        const ext = dataUrl.includes('image/png') ? '.png' : '.jpg';
        const safeFilename = sanitizeFilename(filename) + ext;

        // 创建文件
        const fileHandle = await assetsDirHandle.getFileHandle(safeFilename, { create: true });

        // 写入内容
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        // 获取配置的 assets 文件夹名
        const config = await getConfig();
        const assetsFolder = config.assetsFolder || DEFAULT_CONFIG.assetsFolder;

        console.log('[Videoo Notee] 截图已保存:', safeFilename);

        // 返回相对路径（用于 Markdown 引用）
        return `${assetsFolder}/${safeFilename}`;
    } catch (error) {
        console.error('[Videoo Notee] 保存截图失败:', error);
        throw error;
    }
}

/**
 * 列出所有笔记
 */
export async function listNotes() {
    if (!rootDirHandle) {
        return [];
    }

    const notes = [];
    try {
        for await (const entry of rootDirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.md')) {
                const file = await entry.getFile();
                notes.push({
                    name: entry.name,
                    title: entry.name.replace('.md', ''),
                    lastModified: file.lastModified
                });
            }
        }
        // 按修改时间倒序排序
        notes.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
        console.error('[Videoo Notee] 列出笔记失败:', error);
    }

    return notes;
}

/**
 * 读取笔记内容
 * @param {string} filename - 文件名
 */
export async function readNote(filename) {
    if (!rootDirHandle) {
        throw new Error('请先选择保存目录');
    }

    try {
        const fileHandle = await rootDirHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        const content = await file.text();
        return content;
    } catch (error) {
        console.error('[Videoo Notee] 读取笔记失败:', error);
        throw error;
    }
}

/**
 * 读取资源文件（图片等）
 * @param {string} path - 相对路径 (e.g., "assets/screenshot.jpg")
 * @returns {Promise<Blob>} 文件 Blob 对象
 */
export async function readResource(path) {
    if (!rootDirHandle) throw new Error('未选择目录');

    try {
        // 简单处理路径分隔符
        const parts = path.split('/');
        let currentHandle = rootDirHandle;

        // 遍历目录
        for (let i = 0; i < parts.length - 1; i++) {
            currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
        }

        // 获取文件
        const filename = parts[parts.length - 1];
        const fileHandle = await currentHandle.getFileHandle(filename);
        return await fileHandle.getFile();
    } catch (error) {
        console.error('[Videoo Notee] 读取资源失败:', path, error);
        return null;
    }
}

/**
 * 删除笔记
 * @param {string} filename - 文件名
 */
export async function deleteNote(filename) {
    if (!rootDirHandle) {
        throw new Error('请先选择保存目录');
    }

    try {
        await rootDirHandle.removeEntry(filename);
        console.log('[Videoo Notee] 笔记已删除:', filename);
    } catch (error) {
        console.error('[Videoo Notee] 删除笔记失败:', error);
        throw error;
    }
}

/**
 * 检查是否已选择保存目录
 */
export function hasDirectoryAccess() {
    return rootDirHandle !== null;
}

/**
 * 获取当前保存目录名称
 */
export function getDirectoryName() {
    return rootDirHandle?.name || null;
}

/**
 * 清除文件名中的非法字符
 */
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 200); // 限制长度
}

// ============ IndexedDB 存储目录句柄 ============

const DB_NAME = 'videoo-notee-fs';
const DB_VERSION = 1;
const STORE_NAME = 'handles';

/**
 * 打开 IndexedDB
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

/**
 * 保存目录句柄到 IndexedDB
 */
async function saveDirectoryHandle(handle) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(handle, 'rootDir');
        await tx.complete;
    } catch (error) {
        console.error('[Videoo Notee] 保存目录句柄失败:', error);
    }
}

/**
 * 从 IndexedDB 获取保存的目录句柄
 */
async function getSavedDirectoryHandle() {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.get('rootDir');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Videoo Notee] 获取目录句柄失败:', error);
        return null;
    }
}

// ============ 配置管理 ============

/**
 * 获取存储配置
 */
async function getConfig() {
    try {
        const result = await chrome.storage.local.get('fileSystemConfig');
        return result.fileSystemConfig || DEFAULT_CONFIG;
    } catch (error) {
        return DEFAULT_CONFIG;
    }
}

/**
 * 保存存储配置
 */
export async function setConfig(config) {
    try {
        await chrome.storage.local.set({
            fileSystemConfig: { ...DEFAULT_CONFIG, ...config }
        });

        // 如果 assets 文件夹名称改变，重新创建
        if (config.assetsFolder && rootDirHandle) {
            await ensureAssetsFolder();
        }
    } catch (error) {
        console.error('[Videoo Notee] 保存配置失败:', error);
    }
}

/**
 * 获取 assets 文件夹名称
 */
export async function getAssetsFolder() {
    const config = await getConfig();
    return config.assetsFolder || DEFAULT_CONFIG.assetsFolder;
}

export default {
    initFileSystem,
    requestDirectoryAccess,
    saveNote,
    saveScreenshot,
    listNotes,
    readNote,
    readResource,
    deleteNote,
    hasDirectoryAccess,
    getDirectoryName,
    setConfig,
    getAssetsFolder
};
