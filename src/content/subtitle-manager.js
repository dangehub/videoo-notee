/**
 * Bilibili 字幕管理模块
 * 负责获取和解析 Bilibili 视频字幕
 */

/**
 * 获取当前视频信息 (aid, cid, bvid)
 * 使用 Bilibili API 获取，比 DOM 解析更稳定
 * @returns {Promise<{aid: string, cid: string, bvid: string}|null>}
 */
export async function getBilibiliVideoInfo() {
    try {
        // 1. 从 URL 获取 bvid
        const match = window.location.pathname.match(/\/video\/(BV\w+)/);
        if (!match) {
            console.warn('[Videoo Notee] URL 中未找到 BV 号');
            return null;
        }
        const bvid = match[1];

        // 2. 获取当前分P (p=1 if not present)
        const urlParams = new URLSearchParams(window.location.search);
        let page = parseInt(urlParams.get('p') || '1', 10);
        if (isNaN(page) || page < 1) page = 1;

        // 3. 调用 API 获取详细信息 (包含所有分P的 cid)
        // API: https://api.bilibili.com/x/web-interface/view?bvid={bvid}
        console.log(`[Videoo Notee] Fetching video info for ${bvid}, page ${page}`);

        const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(`获取视频信息失败: ${data.message}`);
        }

        const videoData = data.data;
        const aid = videoData.aid;
        const videoTitle = videoData.title;

        // 4. 智能匹配 CID (优先通过时长匹配，其次通过 p 参数)
        // 获取当前播放器视频时长
        const videoElement = document.querySelector('video');
        const currentDuration = videoElement ? videoElement.duration : 0;

        let targetPage = null;

        // 策略 A: 时长匹配 (误差 2秒内)
        if (currentDuration > 0 && videoData.pages.length > 1) {
            targetPage = videoData.pages.find(p => Math.abs(p.duration - currentDuration) < 2);
            if (targetPage) {
                console.log(`[Videoo Notee] Matched CID by duration: ${currentDuration}s ≈ ${targetPage.duration}s (Page ${targetPage.page})`);
            }
        }

        // 策略 B: URL p 参数匹配 (Fallback)
        if (!targetPage) {
            targetPage = videoData.pages.find(p => p.page === page);
            console.log(`[Videoo Notee] Matched CID by URL page param: ${page}`);
        }

        // 策略 C: 默认取第一页
        if (!targetPage) {
            targetPage = videoData.pages[0];
            console.log('[Videoo Notee] Fallback to first page CID');
        }

        const cid = targetPage ? targetPage.cid : videoData.cid;
        const partTitle = targetPage ? targetPage.part : '';

        console.log('[Videoo Notee] Resolved video info:', {
            videoTitle,
            partTitle,
            aid,
            cid,
            bvid,
            currentPage: page,
            matchedMethod: targetPage ? 'Matched' : 'Default'
        });

        return {
            aid: String(aid),
            cid: String(cid),
            bvid: String(bvid)
        };

    } catch (e) {
        console.error('[Videoo Notee] getBilibiliVideoInfo 错误:', e);
        return null;
    }
}

/**
 * 获取字幕列表
 */
export async function fetchSubtitleList(videoInfo) {
    if (!videoInfo || (!videoInfo.cid && !videoInfo.bvid)) {
        throw new Error('缺少视频信息 (cid 或 bvid)');
    }

    const { cid, bvid } = videoInfo; // 移除 aid，仅使用 cid 和 bvid

    // API: https://api.bilibili.com/x/player/v2?cid={cid}&bvid={bvid}
    const params = new URLSearchParams();
    if (cid) params.append('cid', cid);
    if (bvid) params.append('bvid', bvid);

    const apiUrl = `https://api.bilibili.com/x/player/v2?${params.toString()}`;
    console.log('[Videoo Notee] Requesting Subtitle List URL:', apiUrl);

    try {
        const response = await fetch(apiUrl, {
            credentials: 'include' // 关键：跨子域请求需要携带 Cookie
        });
        const data = await response.json();

        if (data.code !== 0) {
            // -400 通常是参数错误 (如 cid 不存在)
            throw new Error(`API 错误: ${data.message} (Code: ${data.code})`);
        }

        const subtitles = data.data?.subtitle?.subtitles || [];

        console.log(`[Videoo Notee] Found ${subtitles.length} subtitles`);
        if (subtitles.length > 0) {
            console.log('[Videoo Notee] First subtitle data:', subtitles[0]);
        }

        // 转换为统一格式
        return subtitles.map(sub => ({
            id: sub.id,
            lang: sub.lan,
            label: sub.lan_doc,
            url: sub.subtitle_url,
            isMachine: sub.is_lock
        }));

    } catch (error) {
        console.error('[Videoo Notee] 获取字幕列表失败:', error);
        throw error;
    }
}

/**
 * 获取并解析字幕内容
 */
export async function fetchSubtitleContent(url) {
    // 确保 URL 协议正确
    if (url.startsWith('//')) {
        url = 'https:' + url;
    }

    // 确保 HTTPS
    if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
    }

    console.log('[Videoo Notee] Downloading subtitle content from:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // 抛出错误以触发 catch 中的 fallback
            throw new Error(`Direct fetch failed: ${response.status}`);
        }
        const data = await response.json();

        // 解析 JSON 字幕为标准格式 [{start, end, text}]
        // B站格式: { body: [ { from: 0.1, to: 1.2, content: "text" }, ... ] }
        if (!data.body) return [];

        return data.body.map(item => ({
            start: item.from, // 秒
            end: item.to,     // 秒
            text: item.content
        }));

    } catch (error) {
        console.warn('[Videoo Notee] 直接获取字幕内容失败，尝试通过 Background 代理:', error);

        // Fallback: Send message to background to fetch
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'VN_FETCH_URL',
                data: { url }
            });

            if (!response.success) {
                throw new Error(response.error || 'Background fetch failed');
            }

            const data = response.data;
            if (!data.body) return [];

            return data.body.map(item => ({
                start: item.from,
                end: item.to,
                text: item.content
            }));
        } catch (bgError) {
            console.error('[Videoo Notee] Background 代理获取也失败:', bgError);
            throw bgError;
        }
    }
}
