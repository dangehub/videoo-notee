/**
 * 平台适配器基类
 * 定义通用接口，供各平台实现
 */

export class BasePlatformAdapter {
    constructor() {
        this.videoElement = null;
        this.observers = [];
    }

    /**
     * 检测当前页面是否匹配该平台
     * @param {string} url - 页面 URL
     * @returns {boolean}
     */
    static match(url) {
        throw new Error('子类必须实现 match 方法');
    }

    /**
     * 初始化适配器
     */
    async init() {
        this.videoElement = await this.findVideoElement();
        this.setupNavigationListener();
    }

    /**
     * 查找视频元素
     * @returns {Promise<HTMLVideoElement | null>}
     */
    async findVideoElement() {
        throw new Error('子类必须实现 findVideoElement 方法');
    }

    /**
     * 获取视频元素
     * @returns {HTMLVideoElement | null}
     */
    getVideoElement() {
        return this.videoElement;
    }

    /**
     * 获取视频信息
     * @returns {Object}
     */
    getVideoInfo() {
        return {
            url: window.location.href,
            title: document.title,
            duration: this.videoElement?.duration || 0,
            currentTime: this.videoElement?.currentTime || 0
        };
    }

    /**
     * 获取内嵌编辑器容器位置
     * 返回建议插入编辑器的 DOM 元素
     * @returns {HTMLElement | null}
     */
    getEmbedContainer() {
        return null;
    }

    /**
     * 获取浮动工具栏的定位参考元素
     * @returns {HTMLElement | null}
     */
    getToolbarAnchor() {
        return this.videoElement;
    }

    /**
     * 设置页面导航监听（SPA 路由变化）
     */
    setupNavigationListener() {
        // 监听 URL 变化
        let lastUrl = location.href;

        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                this.onNavigate(location.href);
            }
        });

        observer.observe(document.body, { subtree: true, childList: true });
        this.observers.push(observer);

        // 监听 popstate
        window.addEventListener('popstate', () => {
            this.onNavigate(location.href);
        });
    }

    /**
     * 页面导航回调
     * @param {string} url - 新 URL
     */
    onNavigate(url) {
        // 重新查找视频元素
        this.findVideoElement().then(el => {
            this.videoElement = el;
        });
    }

    /**
     * 清理资源
     */
    destroy() {
        this.observers.forEach(obs => obs.disconnect());
        this.observers = [];
        this.videoElement = null;
    }

    /**
     * 等待元素出现
     * @param {string} selector - CSS 选择器
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<Element | null>}
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const el = document.querySelector(selector);
                if (el) {
                    obs.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }, timeout);
        });
    }
}

export default BasePlatformAdapter;
