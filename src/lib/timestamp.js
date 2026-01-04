/**
 * 时间戳工具
 * 处理视频时间戳的格式化和链接生成
 */

/**
 * 格式化秒数为时间字符串
 * @param {number} seconds - 秒数
 * @param {boolean} forceHours - 是否强制显示小时
 * @returns {string} 格式化的时间字符串 (HH:MM:SS 或 MM:SS)
 */
export function formatTimestamp(seconds, forceHours = false) {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    return '0:00';
  }
  
  seconds = Math.max(0, Math.floor(seconds));
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0 || forceHours) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * 解析时间字符串为秒数
 * @param {string} timeStr - 时间字符串 (HH:MM:SS 或 MM:SS 或 SS)
 * @returns {number} 秒数
 */
export function parseTimestamp(timeStr) {
  if (typeof timeStr !== 'string') {
    return 0;
  }
  
  const parts = timeStr.split(':').map(Number);
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  
  return 0;
}

/**
 * 视频平台类型
 */
export const VideoPlatform = {
  YOUTUBE: 'youtube',
  BILIBILI: 'bilibili',
  LOCAL: 'local',
  UNKNOWN: 'unknown'
};

/**
 * 检测视频平台
 * @param {string} url - 视频 URL
 * @returns {string} 平台类型
 */
export function detectPlatform(url) {
  if (!url) return VideoPlatform.UNKNOWN;
  
  if (url.startsWith('file://')) {
    return VideoPlatform.LOCAL;
  }
  
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();
    
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      return VideoPlatform.YOUTUBE;
    }
    
    if (host.includes('bilibili.com') || host.includes('b23.tv')) {
      return VideoPlatform.BILIBILI;
    }
  } catch {
    // URL 解析失败
  }
  
  return VideoPlatform.UNKNOWN;
}

/**
 * 生成带时间戳的视频链接
 * @param {string} videoUrl - 视频 URL
 * @param {number} seconds - 时间戳（秒）
 * @returns {string} 带时间戳的链接
 */
export function generateTimestampLink(videoUrl, seconds) {
  if (!videoUrl) return '';
  
  const platform = detectPlatform(videoUrl);
  const time = Math.floor(seconds);
  
  switch (platform) {
    case VideoPlatform.YOUTUBE:
      return generateYouTubeLink(videoUrl, time);
    
    case VideoPlatform.BILIBILI:
      return generateBilibiliLink(videoUrl, time);
    
    case VideoPlatform.LOCAL:
      return `${videoUrl}#t=${time}`;
    
    default:
      // 尝试通用格式
      try {
        const urlObj = new URL(videoUrl);
        urlObj.searchParams.set('t', time.toString());
        return urlObj.toString();
      } catch {
        return videoUrl;
      }
  }
}

/**
 * 生成 YouTube 时间戳链接
 */
function generateYouTubeLink(url, seconds) {
  try {
    const urlObj = new URL(url);
    
    // 处理 youtu.be 短链接
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}`;
    }
    
    // 处理标准 YouTube 链接
    urlObj.searchParams.set('t', seconds.toString());
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * 生成 B站时间戳链接
 */
function generateBilibiliLink(url, seconds) {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('t', seconds.toString());
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * 从 URL 提取视频 ID
 * @param {string} url - 视频 URL
 * @returns {{platform: string, id: string} | null}
 */
export function extractVideoId(url) {
  const platform = detectPlatform(url);
  
  try {
    const urlObj = new URL(url);
    
    switch (platform) {
      case VideoPlatform.YOUTUBE: {
        // youtube.com/watch?v=xxx
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          return { platform, id: videoId };
        }
        // youtu.be/xxx
        if (urlObj.hostname === 'youtu.be') {
          return { platform, id: urlObj.pathname.slice(1) };
        }
        break;
      }
      
      case VideoPlatform.BILIBILI: {
        // bilibili.com/video/BVxxx
        const match = urlObj.pathname.match(/\/video\/(BV[\w]+|av\d+)/i);
        if (match) {
          return { platform, id: match[1] };
        }
        break;
      }
      
      case VideoPlatform.LOCAL:
        return { platform, id: urlObj.pathname };
    }
  } catch {
    // URL 解析失败
  }
  
  return null;
}

/**
 * 生成 Markdown 时间戳链接
 * @param {string} videoUrl - 视频 URL
 * @param {number} seconds - 时间戳（秒）
 * @returns {string} Markdown 格式的链接
 */
export function generateMarkdownTimestampLink(videoUrl, seconds) {
  const timeStr = formatTimestamp(seconds);
  const link = generateTimestampLink(videoUrl, seconds);
  return `[${timeStr}](${link})`;
}

export default {
  formatTimestamp,
  parseTimestamp,
  detectPlatform,
  generateTimestampLink,
  extractVideoId,
  generateMarkdownTimestampLink,
  VideoPlatform
};
