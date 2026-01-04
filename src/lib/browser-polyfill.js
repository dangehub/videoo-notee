/**
 * 浏览器兼容层
 * 统一 Chrome 和 Firefox 的 API 差异
 */

// 检测浏览器类型
const isFirefox = typeof browser !== 'undefined';
const isChrome = typeof chrome !== 'undefined' && !isFirefox;

// 统一 API 入口
const browserAPI = isFirefox ? browser : chrome;

/**
 * 将回调式 API 转换为 Promise
 * Chrome 的一些旧 API 仍使用回调，Firefox 使用 Promise
 */
function promisify(fn) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (result) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  };
}

/**
 * 存储 API 封装
 */
export const storage = {
  async get(keys) {
    return browserAPI.storage.local.get(keys);
  },
  
  async set(items) {
    return browserAPI.storage.local.set(items);
  },
  
  async remove(keys) {
    return browserAPI.storage.local.remove(keys);
  },
  
  async clear() {
    return browserAPI.storage.local.clear();
  }
};

/**
 * 下载 API 封装
 */
export const downloads = {
  async download(options) {
    return new Promise((resolve, reject) => {
      browserAPI.downloads.download(options, (downloadId) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(downloadId);
        }
      });
    });
  }
};

/**
 * 标签页 API 封装
 */
export const tabs = {
  async query(queryInfo) {
    return browserAPI.tabs.query(queryInfo);
  },
  
  async create(createProperties) {
    return browserAPI.tabs.create(createProperties);
  },
  
  async sendMessage(tabId, message) {
    return browserAPI.tabs.sendMessage(tabId, message);
  },
  
  async getCurrent() {
    return browserAPI.tabs.getCurrent();
  }
};

/**
 * 运行时 API 封装
 */
export const runtime = {
  getURL(path) {
    return browserAPI.runtime.getURL(path);
  },
  
  sendMessage(message) {
    return browserAPI.runtime.sendMessage(message);
  },
  
  onMessage: browserAPI.runtime.onMessage,
  
  get lastError() {
    return browserAPI.runtime.lastError;
  }
};

/**
 * 侧边栏 API 封装
 */
export const sidePanel = {
  async open(options) {
    if (browserAPI.sidePanel) {
      return browserAPI.sidePanel.open(options);
    }
    // Firefox 不支持 sidePanel，回退到新标签页
    return tabs.create({ url: runtime.getURL('editor/index.html') });
  },
  
  async setOptions(options) {
    if (browserAPI.sidePanel) {
      return browserAPI.sidePanel.setOptions(options);
    }
  }
};

/**
 * 脚本注入 API 封装
 */
export const scripting = {
  async executeScript(injection) {
    return browserAPI.scripting.executeScript(injection);
  }
};

// 导出浏览器类型检测
export { isFirefox, isChrome, browserAPI };

// 默认导出
export default {
  storage,
  downloads,
  tabs,
  runtime,
  sidePanel,
  scripting,
  isFirefox,
  isChrome,
  browserAPI
};
