/**
 * Markdown 生成工具
 * 将笔记转换为 Markdown 格式
 */

import { formatTimestamp, generateTimestampLink } from './timestamp.js';

/**
 * 笔记导出选项
 */
export const ExportOptions = {
  // Obsidian 兼容模式
  obsidianCompatible: true,
  // 包含时间戳
  includeTimestamps: true,
  // 包含截图
  includeScreenshots: true,
  // 图片格式: 'embed' | 'link' | 'base64'
  imageFormat: 'embed',
  // 使用 wikilink 语法
  useWikilinks: false
};

/**
 * 生成笔记的 Markdown 内容
 * @param {Object} note - 笔记对象
 * @param {Object} options - 导出选项
 * @returns {string} Markdown 内容
 */
export function generateMarkdown(note, options = {}) {
  const opts = { ...ExportOptions, ...options };
  const lines = [];
  
  // 标题
  lines.push(`# ${escapeMarkdown(note.title || '视频笔记')}`);
  lines.push('');
  
  // 元数据
  if (note.videoUrl) {
    lines.push(`> **视频链接**: ${note.videoUrl}`);
  }
  if (note.videoTitle) {
    lines.push(`> **视频标题**: ${escapeMarkdown(note.videoTitle)}`);
  }
  if (note.createdAt) {
    lines.push(`> **创建时间**: ${formatDate(note.createdAt)}`);
  }
  lines.push('');
  
  // 描述/摘要
  if (note.description) {
    lines.push(note.description);
    lines.push('');
  }
  
  // 笔记条目
  if (note.entries && note.entries.length > 0) {
    lines.push('---');
    lines.push('');
    
    for (const entry of note.entries) {
      lines.push(...generateEntryMarkdown(entry, note.videoUrl, opts));
      lines.push('');
    }
  }
  
  // AI 总结
  if (note.aiSummary) {
    lines.push('---');
    lines.push('');
    lines.push('## AI 总结');
    lines.push('');
    lines.push(note.aiSummary);
    lines.push('');
  }
  
  // 字幕内容
  if (note.subtitles && opts.includeSubtitles) {
    lines.push('---');
    lines.push('');
    lines.push('## 字幕');
    lines.push('');
    lines.push('```');
    lines.push(note.subtitles);
    lines.push('```');
  }
  
  return lines.join('\n');
}

/**
 * 生成单个条目的 Markdown
 */
function generateEntryMarkdown(entry, videoUrl, opts) {
  const lines = [];
  
  // 时间戳标题
  if (opts.includeTimestamps && entry.timestamp !== undefined) {
    const timeStr = formatTimestamp(entry.timestamp);
    
    if (videoUrl) {
      const link = generateTimestampLink(videoUrl, entry.timestamp);
      lines.push(`### [${timeStr}](${link})`);
    } else {
      lines.push(`### ${timeStr}`);
    }
    lines.push('');
  }
  
  // 截图
  if (opts.includeScreenshots && entry.screenshot) {
    const imgMarkdown = generateImageMarkdown(entry.screenshot, entry.screenshotPath, opts);
    lines.push(imgMarkdown);
    lines.push('');
  }
  
  // 笔记文本
  if (entry.text) {
    lines.push(entry.text);
    lines.push('');
  }
  
  // 标签
  if (entry.tags && entry.tags.length > 0) {
    if (opts.obsidianCompatible) {
      // Obsidian 风格标签
      lines.push(entry.tags.map(tag => `#${tag}`).join(' '));
    } else {
      lines.push(`*Tags: ${entry.tags.join(', ')}*`);
    }
    lines.push('');
  }
  
  return lines;
}

/**
 * 生成图片 Markdown
 */
function generateImageMarkdown(screenshot, path, opts) {
  if (opts.imageFormat === 'base64' && screenshot.startsWith('data:')) {
    // 嵌入 Base64
    return `![截图](${screenshot})`;
  }
  
  if (path) {
    if (opts.useWikilinks && opts.obsidianCompatible) {
      // Obsidian wikilink 格式
      const filename = path.split(/[/\\]/).pop();
      return `![[${filename}]]`;
    }
    // 标准 Markdown
    return `![截图](${path})`;
  }
  
  // 默认使用 Base64
  return `![截图](${screenshot})`;
}

/**
 * 转义 Markdown 特殊字符
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([*_`\[\]#])/g, '\\$1');
}

/**
 * 格式化日期
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 生成 Obsidian 兼容的 wikilink
 * @param {string} target - 链接目标
 * @param {string} display - 显示文本
 * @returns {string}
 */
export function wikilink(target, display = null) {
  if (display) {
    return `[[${target}|${display}]]`;
  }
  return `[[${target}]]`;
}

/**
 * 生成笔记文件名
 * @param {Object} note - 笔记对象
 * @returns {string} 安全的文件名
 */
export function generateFilename(note) {
  let name = note.title || note.videoTitle || 'note';
  
  // 替换非法字符
  name = name.replace(/[<>:"/\\|?*]/g, '_');
  // 限制长度
  name = name.slice(0, 100);
  // 添加时间戳避免重名
  const timestamp = formatDate(Date.now()).replace(/[/:]/g, '-').replace(/\s/g, '_');
  
  return `${name}_${timestamp}.md`;
}

export default {
  generateMarkdown,
  wikilink,
  generateFilename,
  ExportOptions
};
