/**
 * 本地字幕解析器
 * 支持 SRT 和 VTT 格式
 */

import { SubtitleProvider } from './interface.js';

export class LocalSubtitleProvider extends SubtitleProvider {
    constructor(options = {}) {
        super(options);
        this.platform = 'local';
        this.loadedSubtitles = [];
    }

    /**
     * 检查是否为本地视频
     */
    matchUrl(url) {
        return url.startsWith('file://') || url.startsWith('blob:');
    }

    /**
     * 从文件加载字幕
     * @param {File} file - 字幕文件
     */
    async loadFromFile(file) {
        const content = await this.readFile(file);
        const format = this.detectFormat(file.name);

        let entries;
        switch (format) {
            case 'srt':
                entries = this.parseSRT(content);
                break;
            case 'vtt':
                entries = this.parseVTT(content);
                break;
            default:
                throw new Error(`不支持的字幕格式: ${format}`);
        }

        this.loadedSubtitles = entries;
        return entries;
    }

    /**
     * 获取可用字幕
     */
    async getAvailableSubtitles() {
        if (this.loadedSubtitles.length > 0) {
            return [{
                id: 'local',
                language: 'unknown',
                label: '本地字幕',
                isAuto: false
            }];
        }
        return [];
    }

    /**
     * 获取字幕内容
     */
    async getSubtitle(subtitleId) {
        return this.loadedSubtitles;
    }

    /**
     * 获取当前显示的字幕
     */
    async getCurrentSubtitle() {
        return '';
    }

    /**
     * 解析 SRT 格式
     */
    parseSRT(content) {
        const entries = [];
        const blocks = content.trim().split(/\n\n+/);

        for (const block of blocks) {
            const lines = block.split('\n');
            if (lines.length < 3) continue;

            // 第二行是时间戳
            const timeMatch = lines[1].match(
                /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
            );

            if (!timeMatch) continue;

            const start = this.timeToMs(
                parseInt(timeMatch[1]),
                parseInt(timeMatch[2]),
                parseInt(timeMatch[3]),
                parseInt(timeMatch[4])
            );

            const end = this.timeToMs(
                parseInt(timeMatch[5]),
                parseInt(timeMatch[6]),
                parseInt(timeMatch[7]),
                parseInt(timeMatch[8])
            );

            // 剩余行是字幕文本
            const text = lines.slice(2).join('\n').trim();

            entries.push({ start, end, text });
        }

        return entries;
    }

    /**
     * 解析 VTT 格式
     */
    parseVTT(content) {
        const entries = [];

        // 移除 WEBVTT 头部
        const bodyContent = content.replace(/^WEBVTT.*?\n\n/s, '');
        const blocks = bodyContent.trim().split(/\n\n+/);

        for (const block of blocks) {
            const lines = block.split('\n');

            // 查找时间戳行
            let timeLineIndex = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('-->')) {
                    timeLineIndex = i;
                    break;
                }
            }

            const timeLine = lines[timeLineIndex];
            const timeMatch = timeLine.match(
                /(\d{2}):?(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):?(\d{2}):(\d{2})\.(\d{3})/
            );

            if (!timeMatch) continue;

            const start = this.timeToMs(
                parseInt(timeMatch[1]),
                parseInt(timeMatch[2]),
                parseInt(timeMatch[3]),
                parseInt(timeMatch[4])
            );

            const end = this.timeToMs(
                parseInt(timeMatch[5]),
                parseInt(timeMatch[6]),
                parseInt(timeMatch[7]),
                parseInt(timeMatch[8])
            );

            // 时间戳后的行是字幕文本
            const text = lines.slice(timeLineIndex + 1).join('\n').trim();

            if (text) {
                entries.push({ start, end, text });
            }
        }

        return entries;
    }

    /**
     * 转换为统一格式
     */
    parseToCommon(data) {
        if (typeof data === 'string') {
            // 尝试自动检测格式
            if (data.trim().startsWith('WEBVTT')) {
                return this.parseVTT(data);
            }
            return this.parseSRT(data);
        }
        return data;
    }

    /**
     * 时间转毫秒
     */
    timeToMs(h, m, s, ms) {
        return h * 3600000 + m * 60000 + s * 1000 + ms;
    }

    /**
     * 读取文件内容
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * 检测字幕格式
     */
    detectFormat(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'srt') return 'srt';
        if (ext === 'vtt' || ext === 'webvtt') return 'vtt';
        return 'unknown';
    }
}

export default LocalSubtitleProvider;
