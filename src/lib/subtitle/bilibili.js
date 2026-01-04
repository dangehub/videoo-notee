/**
 * B站字幕提取器
 */

import { SubtitleProvider } from './interface.js';

export class BilibiliSubtitleProvider extends SubtitleProvider {
    constructor(options = {}) {
        super(options);
        this.platform = 'bilibili';
    }

    /**
     * 检查 URL 是否匹配 B站
     */
    matchUrl(url) {
        return /bilibili\.com|b23\.tv/i.test(url);
    }

    /**
     * 获取可用字幕列表
     */
    async getAvailableSubtitles() {
        const videoInfo = this.getVideoInfo();
        if (!videoInfo) {
            return [];
        }

        const { aid, cid } = videoInfo;

        try {
            // 调用 B站 API 获取字幕信息
            const response = await fetch(
                `https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`,
                { credentials: 'include' }
            );
            const data = await response.json();

            if (data.code !== 0 || !data.data?.subtitle?.subtitles) {
                return [];
            }

            return data.data.subtitle.subtitles.map(sub => ({
                id: sub.subtitle_url,
                language: sub.lan,
                label: sub.lan_doc,
                isAuto: sub.ai_type > 0
            }));
        } catch (error) {
            console.error('[Videoo Notee] B站字幕列表获取失败:', error);
            return [];
        }
    }

    /**
     * 获取字幕内容
     */
    async getSubtitle(subtitleUrl) {
        try {
            // B站字幕 URL 可能是相对路径
            const url = subtitleUrl.startsWith('http')
                ? subtitleUrl
                : `https:${subtitleUrl}`;

            const response = await fetch(url);
            const data = await response.json();
            return this.parseToCommon(data);
        } catch (error) {
            console.error('[Videoo Notee] B站字幕获取失败:', error);
            return [];
        }
    }

    /**
     * 获取当前显示的字幕
     */
    async getCurrentSubtitle() {
        // 尝试从 DOM 获取当前字幕
        const subtitleContainer = document.querySelector('.bpx-player-subtitle-panel-text');
        if (subtitleContainer) {
            return subtitleContainer.textContent || '';
        }
        return '';
    }

    /**
     * 解析 B站 JSON 字幕为统一格式
     */
    parseToCommon(jsonData) {
        if (!jsonData?.body) {
            return [];
        }

        return jsonData.body.map(item => ({
            start: item.from * 1000,
            end: item.to * 1000,
            text: item.content
        }));
    }

    /**
     * 从页面获取视频信息
     */
    getVideoInfo() {
        // 尝试从 window.__INITIAL_STATE__ 获取
        if (window.__INITIAL_STATE__) {
            const state = window.__INITIAL_STATE__;
            return {
                aid: state.aid || state.videoData?.aid,
                bvid: state.bvid || state.videoData?.bvid,
                cid: state.cid || state.videoData?.cid
            };
        }

        // 尝试从 URL 和页面元素解析
        const url = window.location.href;
        const bvidMatch = url.match(/BV[\w]+/i);
        const bvid = bvidMatch ? bvidMatch[0] : null;

        // 尝试从脚本中提取
        const scripts = document.getElementsByTagName('script');
        for (const script of scripts) {
            const aidMatch = script.textContent?.match(/"aid"\s*:\s*(\d+)/);
            const cidMatch = script.textContent?.match(/"cid"\s*:\s*(\d+)/);

            if (aidMatch && cidMatch) {
                return {
                    aid: aidMatch[1],
                    cid: cidMatch[1],
                    bvid
                };
            }
        }

        return null;
    }
}

export default BilibiliSubtitleProvider;
