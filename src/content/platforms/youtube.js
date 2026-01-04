/**
 * YouTube 平台适配器
 */

import BasePlatformAdapter from './base.js';

export class YouTubeAdapter extends BasePlatformAdapter {
    static match(url) {
        return /youtube\.com|youtu\.be/i.test(url);
    }

    async findVideoElement() {
        // YouTube 使用 HTML5 video 元素
        const video = await this.waitForElement('video.html5-main-video, video.video-stream');
        return video;
    }

    getVideoInfo() {
        const baseInfo = super.getVideoInfo();

        // 获取更多 YouTube 特有信息
        const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata');
        const channelElement = document.querySelector('#channel-name a, ytd-channel-name a');

        return {
            ...baseInfo,
            title: titleElement?.textContent?.trim() || document.title.replace(' - YouTube', ''),
            channel: channelElement?.textContent?.trim() || '',
            videoId: this.extractVideoId()
        };
    }

    extractVideoId() {
        const url = new URL(window.location.href);
        return url.searchParams.get('v') || url.pathname.split('/').pop();
    }

    getEmbedContainer() {
        // YouTube 播放器右侧区域
        return document.querySelector('#secondary, #related');
    }

    getToolbarAnchor() {
        // YouTube 播放器控制栏上方
        return document.querySelector('.ytp-chrome-bottom') || this.videoElement;
    }

    /**
     * 获取当前视频的章节信息
     */
    getChapters() {
        const chapters = [];
        const chapterElements = document.querySelectorAll('ytd-macro-markers-list-item-renderer');

        chapterElements.forEach((el, index) => {
            const title = el.querySelector('#details h4')?.textContent?.trim();
            const time = el.querySelector('#time')?.textContent?.trim();

            if (title && time) {
                chapters.push({ index, title, time });
            }
        });

        return chapters;
    }
}

export default YouTubeAdapter;
