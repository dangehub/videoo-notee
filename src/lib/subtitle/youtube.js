/**
 * YouTube 字幕提取器
 */

import { SubtitleProvider } from './interface.js';

export class YouTubeSubtitleProvider extends SubtitleProvider {
    constructor(options = {}) {
        super(options);
        this.platform = 'youtube';
    }

    /**
     * 检查 URL 是否匹配 YouTube
     */
    matchUrl(url) {
        return /youtube\.com|youtu\.be/i.test(url);
    }

    /**
     * 获取可用字幕列表
     */
    async getAvailableSubtitles() {
        const playerResponse = this.getPlayerResponse();
        if (!playerResponse) {
            return [];
        }

        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!captionTracks) {
            return [];
        }

        return captionTracks.map(track => ({
            id: track.baseUrl,
            language: track.languageCode,
            label: track.name?.simpleText || track.languageCode,
            isAuto: track.kind === 'asr'
        }));
    }

    /**
     * 获取字幕内容
     */
    async getSubtitle(subtitleUrl) {
        try {
            // 请求 XML 格式字幕
            const response = await fetch(subtitleUrl);
            const xml = await response.text();
            return this.parseToCommon(xml);
        } catch (error) {
            console.error('[Videoo Notee] YouTube 字幕获取失败:', error);
            return [];
        }
    }

    /**
     * 获取当前显示的字幕
     */
    async getCurrentSubtitle() {
        // 尝试从 DOM 获取当前字幕
        const captionWindow = document.querySelector('.ytp-caption-window-container');
        if (captionWindow) {
            const segments = captionWindow.querySelectorAll('.ytp-caption-segment');
            return Array.from(segments).map(seg => seg.textContent).join(' ');
        }
        return '';
    }

    /**
     * 解析 YouTube XML 字幕为统一格式
     */
    parseToCommon(xmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'text/xml');
        const textNodes = doc.querySelectorAll('text');

        return Array.from(textNodes).map(node => {
            const start = parseFloat(node.getAttribute('start')) * 1000;
            const dur = parseFloat(node.getAttribute('dur') || '0') * 1000;

            return {
                start,
                end: start + dur,
                text: this.decodeHtmlEntities(node.textContent || '')
            };
        });
    }

    /**
     * 获取 ytInitialPlayerResponse
     */
    getPlayerResponse() {
        // 尝试从页面脚本中提取
        if (window.ytInitialPlayerResponse) {
            return window.ytInitialPlayerResponse;
        }

        // 尝试从脚本标签中解析
        const scripts = document.getElementsByTagName('script');
        for (const script of scripts) {
            const match = script.textContent?.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (match) {
                try {
                    return JSON.parse(match[1]);
                } catch {
                    continue;
                }
            }
        }

        return null;
    }

    /**
     * 解码 HTML 实体
     */
    decodeHtmlEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }
}

export default YouTubeSubtitleProvider;
