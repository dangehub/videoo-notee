/**
 * Videoo Notee 构建脚本
 * 支持 Chrome 和 Firefox 双版本构建
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// 命令行参数
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const targetBrowser = args.find(a => a.startsWith('--target='))?.split('=')[1] || 'chrome';

// 目录
const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist', targetBrowser);

/**
 * 清理输出目录
 */
function clean() {
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true });
    }
    fs.mkdirSync(distDir, { recursive: true });
}

/**
 * 复制静态文件
 */
function copyStatic() {
    const staticDirs = ['icons', 'styles'];

    for (const dir of staticDirs) {
        const src = path.join(srcDir, dir);
        const dest = path.join(distDir, dir);

        if (fs.existsSync(src)) {
            copyDir(src, dest);
        }
    }

    // 复制 HTML 文件
    const htmlFiles = [
        'popup/index.html',
        'editor/index.html',
        'player/index.html'
    ];

    for (const file of htmlFiles) {
        const src = path.join(srcDir, file);
        const dest = path.join(distDir, file);

        if (fs.existsSync(src)) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
        }
    }

    // 复制 CSS 文件
    const cssFiles = [
        'popup/popup.css',
        'editor/editor.css',
        'player/player.css'
    ];

    for (const file of cssFiles) {
        const src = path.join(srcDir, file);
        const dest = path.join(distDir, file);

        if (fs.existsSync(src)) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
        }
    }
}

/**
 * 复制目录
 */
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });

    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * 处理 manifest.json
 */
function processManifest() {
    const manifestPath = path.join(srcDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Firefox 特定处理
    if (targetBrowser === 'firefox') {
        // Firefox 使用 browser_specific_settings
        manifest.browser_specific_settings = {
            gecko: {
                id: 'videoo-notee@addon.mozilla.org',
                strict_min_version: '109.0'
            }
        };

        // Firefox 不支持 sidePanel
        delete manifest.side_panel;
        manifest.permissions = manifest.permissions.filter(p => p !== 'sidePanel');

        // Firefox 使用 background.scripts 而不是 service_worker
        manifest.background = {
            scripts: ['background/index.js'],
            type: 'module'
        };
    }

    fs.writeFileSync(
        path.join(distDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
}

/**
 * 构建 JavaScript
 */
async function buildJS() {
    const entryPoints = [
        'background/index.js',
        'content/index.js',
        'popup/popup.js',
        'editor/editor.js',
        'player/player.js'
    ].map(f => path.join(srcDir, f));

    const buildOptions = {
        entryPoints,
        bundle: true,
        outdir: distDir,
        format: 'esm',
        platform: 'browser',
        target: ['chrome88', 'firefox109'],
        sourcemap: isWatch ? 'inline' : false,
        minify: !isWatch,
        define: {
            'process.env.BROWSER': JSON.stringify(targetBrowser)
        }
    };

    if (isWatch) {
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        console.log('👀 Watching for changes...');
    } else {
        await esbuild.build(buildOptions);
    }
}

/**
 * 主函数
 */
async function main() {
    console.log(`🚀 Building for ${targetBrowser}...`);

    clean();
    copyStatic();
    processManifest();
    await buildJS();

    console.log(`✅ Build complete: ${distDir}`);
}

main().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
