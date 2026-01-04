/**
 * AI 总结服务
 * 使用 OpenAI 兼容格式 API
 */

import browser from '../browser-polyfill.js';

/**
 * AI 服务配置
 */
const DEFAULT_CONFIG = {
    apiEndpoint: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7
};

/**
 * AI 总结服务类
 */
export class AISummarizer {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * 从存储加载配置
     */
    async loadConfig() {
        const result = await browser.storage.get('settings');
        if (result.settings?.ai) {
            this.config = { ...this.config, ...result.settings.ai };
        }
        return this.config;
    }

    /**
     * 保存配置
     */
    async saveConfig(config) {
        const result = await browser.storage.get('settings');
        const settings = result.settings || {};
        settings.ai = { ...settings.ai, ...config };
        await browser.storage.set({ settings });
        this.config = { ...this.config, ...config };
    }

    /**
     * 检查是否已配置 API
     */
    isConfigured() {
        return !!this.config.apiKey;
    }

    /**
     * 总结字幕内容
     * @param {string} subtitleText - 字幕文本
     * @param {Object} options - 选项
     * @returns {Promise<string>}
     */
    async summarizeSubtitles(subtitleText, options = {}) {
        const {
            language = 'zh-CN',
            style = 'concise', // 'concise' | 'detailed' | 'bullet'
            maxLength = 500
        } = options;

        const prompt = this.buildSummaryPrompt(subtitleText, { language, style, maxLength });
        return this.chat(prompt);
    }

    /**
     * 生成笔记建议
     * @param {string} subtitleText - 字幕文本
     * @param {number} timestamp - 当前时间戳
     * @returns {Promise<string>}
     */
    async suggestNotes(subtitleText, timestamp) {
        const prompt = `基于以下视频字幕内容，为时间点 ${this.formatTime(timestamp)} 附近的内容生成笔记建议：

${subtitleText}

请提供：
1. 关键要点
2. 可能的笔记内容
3. 相关问题`;

        return this.chat(prompt);
    }

    /**
     * 调用 Chat API
     */
    async chat(userMessage, systemMessage = null) {
        if (!this.isConfigured()) {
            throw new Error('请先配置 AI API Key');
        }

        const messages = [];

        if (systemMessage) {
            messages.push({ role: 'system', content: systemMessage });
        }

        messages.push({ role: 'user', content: userMessage });

        const response = await fetch(`${this.config.apiEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    /**
     * 构建总结 Prompt
     */
    buildSummaryPrompt(text, options) {
        const { language, style, maxLength } = options;

        let styleInstruction = '';
        switch (style) {
            case 'detailed':
                styleInstruction = '请提供详细的总结，包括所有重要细节和论点。';
                break;
            case 'bullet':
                styleInstruction = '请使用要点列表的形式进行总结。';
                break;
            default:
                styleInstruction = '请提供简洁的总结，突出核心内容。';
        }

        return `请总结以下视频字幕内容。

要求：
- 使用 ${language === 'zh-CN' ? '简体中文' : language} 输出
- ${styleInstruction}
- 总结长度不超过 ${maxLength} 字

字幕内容：
${text}`;
    }

    /**
     * 格式化时间
     */
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}

// 创建默认实例
export const aiSummarizer = new AISummarizer();

export default AISummarizer;
