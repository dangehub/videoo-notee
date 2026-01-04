/**
 * 字幕接口定义
 * 通用字幕提供器基类
 */

/**
 * 统一字幕格式
 * @typedef {Object} SubtitleEntry
 * @property {number} start - 开始时间（毫秒）
 * @property {number} end - 结束时间（毫秒）
 * @property {string} text - 字幕文本
 */

/**
 * 字幕信息
 * @typedef {Object} SubtitleInfo
 * @property {string} id - 字幕 ID
 * @property {string} language - 语言代码
 * @property {string} label - 显示名称
 * @property {boolean} isAuto - 是否为自动生成
 */

/**
 * 字幕提供器基类
 * 所有平台适配器必须继承此类
 */
export class SubtitleProvider {
  constructor(options = {}) {
    this.options = options;
  }
  
  /**
   * 获取可用字幕列表
   * @returns {Promise<SubtitleInfo[]>}
   */
  async getAvailableSubtitles() {
    throw new Error('子类必须实现 getAvailableSubtitles 方法');
  }
  
  /**
   * 获取字幕内容
   * @param {string} subtitleId - 字幕 ID
   * @returns {Promise<SubtitleEntry[]>}
   */
  async getSubtitle(subtitleId) {
    throw new Error('子类必须实现 getSubtitle 方法');
  }
  
  /**
   * 获取当前显示的字幕（如果有）
   * @returns {Promise<SubtitleEntry[]>}
   */
  async getCurrentSubtitle() {
    throw new Error('子类必须实现 getCurrentSubtitle 方法');
  }
  
  /**
   * 将原始数据解析为统一格式
   * @param {any} rawData - 原始字幕数据
   * @returns {SubtitleEntry[]}
   */
  parseToCommon(rawData) {
    throw new Error('子类必须实现 parseToCommon 方法');
  }
  
  /**
   * 将字幕转换为纯文本
   * @param {SubtitleEntry[]} entries - 字幕条目
   * @param {Object} options - 选项
   * @returns {string}
   */
  toPlainText(entries, options = {}) {
    const { includeTimestamps = false, separator = '\n' } = options;
    
    return entries.map(entry => {
      if (includeTimestamps) {
        const startTime = this.formatTime(entry.start);
        return `[${startTime}] ${entry.text}`;
      }
      return entry.text;
    }).join(separator);
  }
  
  /**
   * 格式化毫秒为时间字符串
   * @param {number} ms - 毫秒
   * @returns {string}
   */
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

/**
 * 字幕管理器
 * 统一管理不同平台的字幕提取
 */
export class SubtitleManager {
  constructor() {
    this.providers = new Map();
  }
  
  /**
   * 注册字幕提供器
   * @param {string} platform - 平台名称
   * @param {SubtitleProvider} provider - 提供器实例
   */
  registerProvider(platform, provider) {
    this.providers.set(platform, provider);
  }
  
  /**
   * 获取字幕提供器
   * @param {string} platform - 平台名称
   * @returns {SubtitleProvider | null}
   */
  getProvider(platform) {
    return this.providers.get(platform) || null;
  }
  
  /**
   * 检测当前页面的平台并返回对应提供器
   * @param {string} url - 页面 URL
   * @returns {SubtitleProvider | null}
   */
  detectProvider(url) {
    for (const [platform, provider] of this.providers) {
      if (provider.matchUrl && provider.matchUrl(url)) {
        return provider;
      }
    }
    return null;
  }
}

// 创建全局管理器实例
export const subtitleManager = new SubtitleManager();

export default {
  SubtitleProvider,
  SubtitleManager,
  subtitleManager
};
