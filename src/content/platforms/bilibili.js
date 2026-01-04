/**
 * B站平台适配器
 */

import BasePlatformAdapter from './base.js';

export class BilibiliAdapter extends BasePlatformAdapter {
    static match(url) {
        return /bilibili\.com/i.test(url);
    }

    async findVideoElement() {
        // B站使用 HTML5 video 元素
        const video = await this.waitForElement('video, .bpx-player-video-wrap video');
        return video;
    }

    getVideoInfo() {
        const baseInfo = super.getVideoInfo();

        // 获取 B站特有信息
        const titleElement = document.querySelector('h1.video-title, .video-info-title');
        const uploaderElement = document.querySelector('.up-name, .username');

        return {
            ...baseInfo,
            title: titleElement?.textContent?.trim() || document.title.replace('_哔哩哔哩_bilibili', ''),
            uploader: uploaderElement?.textContent?.trim() || '',
            ...this.getBilibiliIds()
        };
    }

    /**
     * 获取 B站视频 ID
     */
    getBilibiliIds() {
        const url = window.location.href;
        const bvidMatch = url.match(/BV[\w]+/i);
        const aidMatch = url.match(/av(\d+)/i);

        // 尝试从页面数据获取
        let cid = null;
        if (window.__INITIAL_STATE__) {
            cid = window.__INITIAL_STATE__.cid || window.__INITIAL_STATE__.videoData?.cid;
        }

        return {
            bvid: bvidMatch ? bvidMatch[0] : null,
            aid: aidMatch ? aidMatch[1] : null,
            cid
        };
    }

    getEmbedContainer() {
        // B站播放器右侧区域
        return document.querySelector('#danmukuBox, .video-info-container, .right-container');
    }

    getToolbarAnchor() {
        // B站播放器控制栏
        return document.querySelector('.bpx-player-control-wrap, .bilibili-player-video-control') || this.videoElement;
    }

    /**
     * 获取当前分P信息
     */
    getCurrentPartInfo() {
        const partList = document.querySelectorAll('.list-box li, .video-pod__item');
        const activePart = document.querySelector('.list-box li.on, .video-pod__item.active');

        return {
            total: partList.length,
            current: activePart ? Array.from(partList).indexOf(activePart) + 1 : 1,
            title: activePart?.textContent?.trim() || ''
        };
    }

    /**
     * 获取弹幕状态
     */
    getDanmakuState() {
        const danmakuBtn = document.querySelector('.bpx-player-dm-switch, .bilibili-player-video-danmaku-switch');
        return {
            enabled: danmakuBtn?.classList.contains('bpx-state-on') || false
        };
    }
}

export default BilibiliAdapter;
