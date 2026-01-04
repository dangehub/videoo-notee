/**
 * 目录选择对话框
 * 首次使用时提示用户选择笔记保存目录
 */

import { requestDirectoryAccess, hasDirectoryAccess, getDirectoryName, setConfig, getAssetsFolder, getSavedHandleInfo, verifyPermission } from '../lib/local-storage.js';

let dialogContainer = null;

/**
 * 显示目录选择对话框
 */
export function showDirectoryDialog(onComplete) {
    if (dialogContainer) {
        dialogContainer.remove();
    }

    dialogContainer = document.createElement('div');
    dialogContainer.className = 'vn-directory-dialog-overlay';

    // 使用 Shadow DOM 隔离样式
    const shadow = dialogContainer.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = getDialogStyles();
    shadow.appendChild(style);

    const dialog = document.createElement('div');
    dialog.className = 'vn-dialog';
    dialog.innerHTML = `
        <div class="vn-dialog-header">
            <h2>选择笔记保存位置</h2>
        </div>
        <div class="vn-dialog-body">
            <p class="vn-dialog-desc">您的笔记以纯 Markdown 格式保存在您的计算机上</p>
            
            <div class="vn-folder-selector">
                <span class="vn-folder-path" id="folder-path">选择文件夹</span>
                <button class="vn-btn-folder" id="btn-select-folder">📁</button>
            </div>
            
            <div class="vn-assets-config">
                <label>
                    <span>截图保存子目录</span>
                    <input type="text" id="assets-folder" value="assets" placeholder="assets">
                </label>
            </div>
            
            <ul class="vn-features">
                <li>🔒 完全离线—数据不会离开您的设备</li>
                <li>📝 笔记在 Obsidian 等应用中即时打开</li>
                <li>🖼️ 截图自动保存到子目录</li>
            </ul>
        </div>
        <div class="vn-dialog-footer">
            <button class="vn-btn vn-btn-cancel" id="btn-cancel">取消</button>
            <button class="vn-btn vn-btn-primary" id="btn-confirm" disabled>选择文件夹</button>
        </div>
    `;

    shadow.appendChild(dialog);
    document.body.appendChild(dialogContainer);

    // 绑定事件
    const folderPath = shadow.getElementById('folder-path');
    const btnSelectFolder = shadow.getElementById('btn-select-folder');
    const assetsInput = shadow.getElementById('assets-folder');
    const btnCancel = shadow.getElementById('btn-cancel');
    const btnConfirm = shadow.getElementById('btn-confirm');

    let folderSelected = false;
    let savedHandle = null;

    // 检查是否有保存的目录
    (async () => {
        const saved = await getSavedHandleInfo();
        if (saved) {
            savedHandle = saved.handle;
            folderPath.textContent = `恢复: ${saved.name}`;
            folderPath.classList.add('saved-hint');
            btnConfirm.textContent = '恢复访问权限';
            btnConfirm.disabled = false;

            // 提示用户
            const desc = shadow.querySelector('.vn-dialog-desc');
            desc.innerHTML = `检测到上次使用的目录: <strong>${saved.name}</strong><br>点击下方按钮恢复访问权限，或点击文件夹图标选择新目录。`;
        }
    })();

    // 选择文件夹
    const selectFolder = async () => {
        try {
            const success = await requestDirectoryAccess();
            if (success) {
                folderSelected = true;
                folderPath.textContent = getDirectoryName();
                folderPath.classList.add('selected');
                btnConfirm.disabled = false;
                btnConfirm.textContent = '确认';
            }
        } catch (error) {
            console.error('选择目录失败:', error);
            folderPath.textContent = '选择失败，请重试';
        }
    };

    btnSelectFolder.addEventListener('click', selectFolder);
    folderPath.addEventListener('click', selectFolder);

    // 取消
    btnCancel.addEventListener('click', () => {
        dialogContainer.remove();
        dialogContainer = null;
        if (onComplete) onComplete(false);
    });

    // 确认
    btnConfirm.addEventListener('click', async () => {
        // 如果是恢复模式
        if (savedHandle && !folderSelected) {
            try {
                const success = await verifyPermission(savedHandle);
                if (success) {
                    dialogContainer.remove();
                    dialogContainer = null;
                    if (onComplete) onComplete(true);
                    return;
                }
            } catch (error) {
                console.error('恢复权限失败:', error);
                folderPath.textContent = '恢复失败，请重新选择';
            }
        }

        if (!folderSelected && !savedHandle) return;

        // 保存 assets 文件夹配置
        const assetsFolder = assetsInput.value.trim() || 'assets';
        await setConfig({ assetsFolder });

        dialogContainer.remove();
        dialogContainer = null;
        if (onComplete) onComplete(true);
    });

    // ESC 键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            dialogContainer.remove();
            dialogContainer = null;
            document.removeEventListener('keydown', handleEsc);
            if (onComplete) onComplete(false);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

/**
 * 检查并显示目录选择对话框（如果需要）
 */
export async function checkAndShowDirectoryDialog() {
    if (!hasDirectoryAccess()) {
        return new Promise((resolve) => {
            showDirectoryDialog(resolve);
        });
    }
    return true;
}

/**
 * 获取对话框样式
 */
function getDialogStyles() {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :host {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .vn-dialog {
            background: #1e1e2e;
            border-radius: 16px;
            width: 90%;
            max-width: 480px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .vn-dialog-header {
            padding: 24px 24px 0;
        }
        
        .vn-dialog-header h2 {
            color: #cdd6f4;
            font-size: 22px;
            font-weight: 600;
        }
        
        .vn-dialog-body {
            padding: 24px;
        }
        
        .vn-dialog-desc {
            color: #a6adc8;
            font-size: 14px;
            margin-bottom: 24px;
            line-height: 1.5;
        }
        
        .vn-folder-selector {
            display: flex;
            align-items: center;
            background: #313244;
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 16px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
        }
        
        .vn-folder-selector:hover {
            background: #45475a;
            border-color: #89b4fa;
        }
        
        .vn-folder-path {
            flex: 1;
            color: #6c7086;
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .vn-folder-path.selected {
            color: #cdd6f4;
            font-weight: 500;
        }
        
        .vn-btn-folder {
            width: 36px;
            height: 36px;
            border: none;
            background: #45475a;
            border-radius: 8px;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .vn-btn-folder:hover {
            background: #585b70;
        }
        
        .vn-assets-config {
            margin-bottom: 20px;
        }
        
        .vn-assets-config label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #a6adc8;
            font-size: 14px;
        }
        
        .vn-assets-config input {
            width: 150px;
            padding: 8px 12px;
            background: #313244;
            border: 1px solid #45475a;
            border-radius: 8px;
            color: #cdd6f4;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .vn-assets-config input:focus {
            border-color: #89b4fa;
        }
        
        .vn-features {
            list-style: none;
            margin-top: 16px;
        }
        
        .vn-features li {
            color: #89b4fa;
            font-size: 14px;
            padding: 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .vn-dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 16px 24px;
            background: #181825;
        }
        
        .vn-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .vn-btn-cancel {
            background: transparent;
            color: #a6adc8;
        }
        
        .vn-btn-cancel:hover {
            background: #313244;
            color: #cdd6f4;
        }
        
        .vn-btn-primary {
            background: #89b4fa;
            color: #1e1e2e;
        }
        
        .vn-btn-primary:hover:not(:disabled) {
            background: #b4befe;
        }
        
        .vn-btn-primary:disabled {
            background: #45475a;
            color: #6c7086;
            cursor: not-allowed;
        }
    `;
}

export default {
    showDirectoryDialog,
    checkAndShowDirectoryDialog
};
