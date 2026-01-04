/**
 * 文件选择对话框
 * 用于打开现有的本地笔记
 */

import { listNotes } from '../lib/local-storage.js';

let dialogContainer = null;

/**
 * 显示文件选择对话框
 * @param {Function} onSelect - 选择文件后的回调 function(filename, content)
 */
export async function showFileListDialog(onSelect) {
    if (dialogContainer) {
        dialogContainer.remove();
    }

    // 获取文件列表
    const notes = await listNotes();

    dialogContainer = document.createElement('div');
    dialogContainer.className = 'vn-file-dialog-overlay';

    // 使用 Shadow DOM 隔离样式
    const shadow = dialogContainer.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = getDialogStyles();
    shadow.appendChild(style);

    const dialog = document.createElement('div');
    dialog.className = 'vn-dialog';
    dialog.innerHTML = `
        <div class="vn-dialog-header">
            <h2>打开笔记</h2>
            <button class="vn-btn-close">×</button>
        </div>
        <div class="vn-dialog-body">
            <div class="vn-search-box">
                <input type="text" id="file-search" placeholder="搜索文件...">
            </div>
            <div class="vn-file-list" id="file-list">
                <!-- 文件列表将在这里渲染 -->
            </div>
        </div>
    `;

    shadow.appendChild(dialog);
    document.body.appendChild(dialogContainer);

    // 渲染列表函数
    const renderList = (filter = '') => {
        const fileList = shadow.getElementById('file-list');
        fileList.innerHTML = '';

        const filteredNotes = notes.filter(note =>
            note.title.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredNotes.length === 0) {
            fileList.innerHTML = '<div class="vn-empty-state">没有找到文件</div>';
            return;
        }

        filteredNotes.forEach(note => {
            const item = document.createElement('div');
            item.className = 'vn-file-item';

            // 格式化日期
            const date = new Date(note.lastModified);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            item.innerHTML = `
                <div class="vn-file-info">
                    <div class="vn-file-title">${note.title}</div>
                    <div class="vn-file-date">${dateStr}</div>
                </div>
                <button class="vn-btn-open">打开</button>
            `;

            item.addEventListener('click', () => {
                closeDialog();
                if (onSelect) onSelect(note);
            });

            fileList.appendChild(item);
        });
    };

    // 初始渲染
    renderList();

    // 绑定事件
    const searchInput = shadow.getElementById('file-search');
    const closeBtn = shadow.querySelector('.vn-btn-close');

    searchInput.addEventListener('input', (e) => {
        renderList(e.target.value);
    });

    const closeDialog = () => {
        dialogContainer.remove();
        dialogContainer = null;
        document.removeEventListener('keydown', handleEsc);
    };

    closeBtn.addEventListener('click', closeDialog);

    // ESC 键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeDialog();
        }
    };
    document.addEventListener('keydown', handleEsc);

    // 自动聚焦搜索框
    setTimeout(() => searchInput.focus(), 100);
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
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            height: 80vh; /* 固定高度，内部滚动 */
            max-height: 600px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            animation: slideIn 0.2s ease;
            color: #cdd6f4;
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        
        .vn-dialog-header {
            padding: 16px 20px;
            border-bottom: 1px solid #313244;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .vn-dialog-header h2 {
            font-size: 18px;
            font-weight: 600;
        }
        
        .vn-btn-close {
            background: transparent;
            border: none;
            color: #a6adc8;
            font-size: 24px;
            cursor: pointer;
            line-height: 1;
        }
        
        .vn-btn-close:hover {
            color: #f38ba8;
        }
        
        .vn-dialog-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 16px;
        }
        
        .vn-search-box {
            margin-bottom: 16px;
        }
        
        .vn-search-box input {
            width: 100%;
            padding: 10px 14px;
            background: #313244;
            border: 1px solid #45475a;
            border-radius: 8px;
            color: #cdd6f4;
            font-size: 14px;
            outline: none;
        }
        
        .vn-search-box input:focus {
            border-color: #89b4fa;
        }
        
        .vn-file-list {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding-right: 4px;
        }
        
        .vn-file-list::-webkit-scrollbar {
            width: 6px;
        }
        
        .vn-file-list::-webkit-scrollbar-thumb {
            background: #45475a;
            border-radius: 3px;
        }
        
        .vn-file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: #181825;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.2s;
        }
        
        .vn-file-item:hover {
            background: #313244;
            border-color: #45475a;
        }
        
        .vn-file-info {
            flex: 1;
            overflow: hidden;
        }
        
        .vn-file-title {
            font-size: 14px;
            color: #cdd6f4;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .vn-file-date {
            font-size: 12px;
            color: #6c7086;
        }
        
        .vn-btn-open {
            padding: 6px 12px;
            background: transparent;
            border: 1px solid #45475a;
            border-radius: 6px;
            color: #89b4fa;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            margin-left: 10px;
        }
        
        .vn-file-item:hover .vn-btn-open {
            background: #89b4fa;
            color: #1e1e2e;
            border-color: #89b4fa;
        }
        
        .vn-empty-state {
            text-align: center;
            color: #6c7086;
            margin-top: 40px;
            font-size: 14px;
        }
    `;
}
