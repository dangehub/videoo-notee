/**
 * Obsidian Clipper 适配层
 * 封装模板编译和变量提取功能
 * 注意：为避免 TypeScript 编译问题，此模块不直接导入 Clipper TS 文件
 *       而是自行实现轻量级模板引擎，语法兼容 Clipper
 */

import dayjs from 'dayjs';

/**
 * 默认 Frontmatter 模板
 */
const DEFAULT_TEMPLATE = `---
title: "{{title}}"
description: "{{description}}"
author: "{{author}}"
source: {{url}}
created: {{date}}
tags:
  - video-note
updated: {{time}}
---

`;

/**
 * 从页面提取元数据变量
 * @returns {Object} 变量对象
 */
export function extractPageVariables() {
    const url = window.location.href;
    const domain = window.location.hostname.replace('www.', '');
    const now = dayjs();

    // 基础变量
    const variables = {
        '{{title}}': document.title || '',
        '{{url}}': url,
        '{{domain}}': domain,
        '{{site}}': domain.split('.')[0],
        '{{date}}': now.format('YYYY-MM-DD'),
        '{{time}}': now.format('YYYY-MM-DDTHH:mm'),
        '{{description}}': '',
        '{{author}}': ''
    };

    // 提取 meta 标签
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')
        || document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    if (metaDescription) {
        variables['{{description}}'] = metaDescription;
    }

    const metaAuthor = document.querySelector('meta[name="author"]')?.getAttribute('content');
    if (metaAuthor) {
        variables['{{author}}'] = metaAuthor;
    }

    // 平台特定提取：Bilibili
    if (domain.includes('bilibili')) {
        variables['{{author}}'] = extractBilibiliAuthor();
        variables['{{description}}'] = extractBilibiliDescription();
    }

    return variables;
}

/**
 * 提取 Bilibili 作者
 */
function extractBilibiliAuthor() {
    // UP 主名称
    const upName = document.querySelector('.up-name')?.textContent?.trim()
        || document.querySelector('.username')?.textContent?.trim()
        || document.querySelector('meta[name="author"]')?.getAttribute('content')
        || '';
    return upName;
}

/**
 * 提取 Bilibili 视频描述（包含统计信息）
 */
function extractBilibiliDescription() {
    const parts = [];

    // 视频简介
    const desc = document.querySelector('.basic-desc-info')?.textContent?.trim()
        || document.querySelector('meta[name="description"]')?.getAttribute('content')
        || '';
    if (desc) parts.push(desc);

    // 统计数据
    const stats = [];
    const viewCount = document.querySelector('.view-text, .video-data-list .view')?.textContent?.trim();
    const danmakuCount = document.querySelector('.dm-text, .video-data-list .dm')?.textContent?.trim();
    const likeCount = document.querySelector('.video-like-info .video-like')?.textContent?.trim();
    const coinCount = document.querySelector('.video-coin-info .video-coin')?.textContent?.trim();
    const favCount = document.querySelector('.video-fav-info .video-fav')?.textContent?.trim();
    const shareCount = document.querySelector('.video-share-info .video-share')?.textContent?.trim();

    if (viewCount) stats.push(`播放 ${viewCount}`);
    if (danmakuCount) stats.push(`弹幕 ${danmakuCount}`);
    if (likeCount) stats.push(`点赞 ${likeCount}`);
    if (coinCount) stats.push(`投币 ${coinCount}`);
    if (favCount) stats.push(`收藏 ${favCount}`);
    if (shareCount) stats.push(`分享 ${shareCount}`);

    if (stats.length > 0) {
        parts.push(`统计: ${stats.join(', ')}`);
    }

    return parts.join(' | ');
}

/**
 * 渲染模板
 * @param {string} template - 模板字符串
 * @param {Object} variables - 变量对象
 * @returns {string} 渲染后的字符串
 */
export function renderTemplate(template, variables) {
    let result = template;

    // 简单变量替换
    for (const [key, value] of Object.entries(variables)) {
        // 处理需要引号转义的值
        const safeValue = String(value).replace(/"/g, '\\"');
        result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), safeValue);
    }

    return result;
}

/**
 * 生成 Frontmatter
 * @param {string} customTemplate - 自定义模板（可选）
 * @returns {string} 生成的 Frontmatter
 */
export function generateFrontmatter(customTemplate = null) {
    const template = customTemplate || DEFAULT_TEMPLATE;
    const variables = extractPageVariables();
    return renderTemplate(template, variables);
}

/**
 * 获取默认模板
 */
export function getDefaultTemplate() {
    return DEFAULT_TEMPLATE;
}

/**
 * 提取属性为键值对数组（用于双栏编辑器）
 * @returns {Array<{key: string, value: string}>}
 */
export function extractPropertiesAsArray() {
    const variables = extractPageVariables();

    return [
        { key: 'title', value: variables['{{title}}'] || '' },
        { key: 'description', value: variables['{{description}}'] || '' },
        { key: 'author', value: variables['{{author}}'] || '' },
        { key: 'source', value: variables['{{url}}'] || '' },
        { key: 'created', value: variables['{{date}}'] || '' },
        { key: 'tags', value: 'video-note' },
        { key: 'updated', value: variables['{{time}}'] || '' }
    ];
}

/**
 * 从属性数组生成 YAML Frontmatter
 * @param {Array<{key: string, value: string}>} properties
 * @returns {string}
 */
export function propertiesToFrontmatter(properties) {
    let yaml = '---\n';

    for (const prop of properties) {
        if (prop.key === 'tags') {
            // tags 特殊处理为列表格式
            const tags = prop.value.split(',').map(t => t.trim()).filter(Boolean);
            if (tags.length > 0) {
                yaml += `${prop.key}:\n`;
                tags.forEach(tag => yaml += `  - ${tag}\n`);
            }
        } else if (prop.value.includes('\n') || prop.value.includes(':')) {
            // 多行或包含冒号的值使用引号
            yaml += `${prop.key}: "${prop.value.replace(/"/g, '\\"')}"\n`;
        } else if (prop.value) {
            yaml += `${prop.key}: ${prop.value}\n`;
        }
    }

    yaml += '---\n\n';
    return yaml;
}

export default {
    extractPageVariables,
    renderTemplate,
    generateFrontmatter,
    getDefaultTemplate,
    extractPropertiesAsArray,
    propertiesToFrontmatter
};
