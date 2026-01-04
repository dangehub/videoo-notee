var j=typeof browser<"u",ze=typeof chrome<"u"&&!j,v=j?browser:chrome;var Ve={async get(t){return v.storage.local.get(t)},async set(t){return v.storage.local.set(t)},async remove(t){return v.storage.local.remove(t)},async clear(){return v.storage.local.clear()}},Ae={async download(t){return new Promise((e,o)=>{v.downloads.download(t,n=>{v.runtime.lastError?o(new Error(v.runtime.lastError.message)):e(n)})})}},ae={async query(t){return v.tabs.query(t)},async create(t){return v.tabs.create(t)},async sendMessage(t,e){return v.tabs.sendMessage(t,e)},async getCurrent(){return v.tabs.getCurrent()}},ce={getURL(t){return v.runtime.getURL(t)},sendMessage(t){return v.runtime.sendMessage(t)},onMessage:v.runtime.onMessage,get lastError(){return v.runtime.lastError}},Fe={async open(t){return v.sidePanel?v.sidePanel.open(t):ae.create({url:ce.getURL("editor/index.html")})},async setOptions(t){if(v.sidePanel)return v.sidePanel.setOptions(t)}},Be={async executeScript(t){return v.scripting.executeScript(t)}};var $={storage:Ve,downloads:Ae,tabs:ae,runtime:ce,sidePanel:Fe,scripting:Be,isFirefox:j,isChrome:ze,browserAPI:v};async function B(t,e={}){let{format:o="jpeg",quality:n=.85}=e;if(!t||!(t instanceof HTMLVideoElement))throw new Error("\u65E0\u6548\u7684\u89C6\u9891\u5143\u7D20");if(t.readyState<2)throw new Error("\u89C6\u9891\u5C1A\u672A\u52A0\u8F7D");let i=t.videoWidth,r=t.videoHeight,a=t.currentTime,c=document.createElement("canvas");c.width=i,c.height=r,c.getContext("2d").drawImage(t,0,0,i,r);let d=`image/${o}`,s=c.toDataURL(d,n),p=await new Promise(m=>{c.toBlob(m,d,n)});return{dataUrl:s,blob:p,width:i,height:r,timestamp:a,format:o}}function Y(t,e=!1){if(typeof t!="number"||isNaN(t))return"0:00";t=Math.max(0,Math.floor(t));let o=Math.floor(t/3600),n=Math.floor(t%3600/60),i=t%60;return o>0||e?`${o}:${n.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}`:`${n}:${i.toString().padStart(2,"0")}`}var W=class{constructor(){this.videoElement=null,this.observers=[]}static match(e){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 match \u65B9\u6CD5")}async init(){this.videoElement=await this.findVideoElement(),this.setupNavigationListener()}async findVideoElement(){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 findVideoElement \u65B9\u6CD5")}getVideoElement(){return this.videoElement}getVideoInfo(){var e,o;return{url:window.location.href,title:document.title,duration:((e=this.videoElement)==null?void 0:e.duration)||0,currentTime:((o=this.videoElement)==null?void 0:o.currentTime)||0}}getEmbedContainer(){return null}getToolbarAnchor(){return this.videoElement}setupNavigationListener(){let e=location.href,o=new MutationObserver(()=>{location.href!==e&&(e=location.href,this.onNavigate(location.href))});o.observe(document.body,{subtree:!0,childList:!0}),this.observers.push(o),window.addEventListener("popstate",()=>{this.onNavigate(location.href)})}onNavigate(e){this.findVideoElement().then(o=>{this.videoElement=o})}destroy(){this.observers.forEach(e=>e.disconnect()),this.observers=[],this.videoElement=null}waitForElement(e,o=5e3){return new Promise(n=>{let i=document.querySelector(e);if(i){n(i);return}let r=new MutationObserver((a,c)=>{let l=document.querySelector(e);l&&(c.disconnect(),n(l))});r.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{r.disconnect(),n(document.querySelector(e))},o)})}},D=W;var _=class extends D{static match(e){return/youtube\.com|youtu\.be/i.test(e)}async findVideoElement(){return await this.waitForElement("video.html5-main-video, video.video-stream")}getVideoInfo(){var i,r;let e=super.getVideoInfo(),o=document.querySelector("h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata"),n=document.querySelector("#channel-name a, ytd-channel-name a");return{...e,title:((i=o==null?void 0:o.textContent)==null?void 0:i.trim())||document.title.replace(" - YouTube",""),channel:((r=n==null?void 0:n.textContent)==null?void 0:r.trim())||"",videoId:this.extractVideoId()}}extractVideoId(){let e=new URL(window.location.href);return e.searchParams.get("v")||e.pathname.split("/").pop()}getEmbedContainer(){return document.querySelector("#secondary, #related")}getToolbarAnchor(){return document.querySelector(".ytp-chrome-bottom")||this.videoElement}getChapters(){let e=[];return document.querySelectorAll("ytd-macro-markers-list-item-renderer").forEach((n,i)=>{var c,l,d,s;let r=(l=(c=n.querySelector("#details h4"))==null?void 0:c.textContent)==null?void 0:l.trim(),a=(s=(d=n.querySelector("#time"))==null?void 0:d.textContent)==null?void 0:s.trim();r&&a&&e.push({index:i,title:r,time:a})}),e}};var z=class extends D{static match(e){return/bilibili\.com/i.test(e)}async findVideoElement(){return await this.waitForElement("video, .bpx-player-video-wrap video")}getVideoInfo(){var i,r;let e=super.getVideoInfo(),o=document.querySelector("h1.video-title, .video-info-title"),n=document.querySelector(".up-name, .username");return{...e,title:((i=o==null?void 0:o.textContent)==null?void 0:i.trim())||document.title.replace("_\u54D4\u54E9\u54D4\u54E9_bilibili",""),uploader:((r=n==null?void 0:n.textContent)==null?void 0:r.trim())||"",...this.getBilibiliIds()}}getBilibiliIds(){var r;let e=window.location.href,o=e.match(/BV[\w]+/i),n=e.match(/av(\d+)/i),i=null;return window.__INITIAL_STATE__&&(i=window.__INITIAL_STATE__.cid||((r=window.__INITIAL_STATE__.videoData)==null?void 0:r.cid)),{bvid:o?o[0]:null,aid:n?n[1]:null,cid:i}}getEmbedContainer(){return document.querySelector("#danmukuBox, .video-info-container, .right-container")}getToolbarAnchor(){return document.querySelector(".bpx-player-control-wrap, .bilibili-player-video-control")||this.videoElement}getCurrentPartInfo(){var n;let e=document.querySelectorAll(".list-box li, .video-pod__item"),o=document.querySelector(".list-box li.on, .video-pod__item.active");return{total:e.length,current:o?Array.from(e).indexOf(o)+1:1,title:((n=o==null?void 0:o.textContent)==null?void 0:n.trim())||""}}getDanmakuState(){let e=document.querySelector(".bpx-player-dm-switch, .bilibili-player-video-danmaku-switch");return{enabled:(e==null?void 0:e.classList.contains("bpx-state-on"))||!1}}};var L=class{constructor(e={}){this.options=e}async getAvailableSubtitles(){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 getAvailableSubtitles \u65B9\u6CD5")}async getSubtitle(e){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 getSubtitle \u65B9\u6CD5")}async getCurrentSubtitle(){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 getCurrentSubtitle \u65B9\u6CD5")}parseToCommon(e){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 parseToCommon \u65B9\u6CD5")}toPlainText(e,o={}){let{includeTimestamps:n=!1,separator:i=`
`}=o;return e.map(r=>n?`[${this.formatTime(r.start)}] ${r.text}`:r.text).join(i)}formatTime(e){let o=Math.floor(e/1e3),n=Math.floor(o/3600),i=Math.floor(o%3600/60),r=o%60;return n>0?`${n}:${i.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`:`${i}:${r.toString().padStart(2,"0")}`}},K=class{constructor(){this.providers=new Map}registerProvider(e,o){this.providers.set(e,o)}getProvider(e){return this.providers.get(e)||null}detectProvider(e){for(let[o,n]of this.providers)if(n.matchUrl&&n.matchUrl(e))return n;return null}},P=new K;var O=class extends L{constructor(e={}){super(e),this.platform="youtube"}matchUrl(e){return/youtube\.com|youtu\.be/i.test(e)}async getAvailableSubtitles(){var n,i;let e=this.getPlayerResponse();if(!e)return[];let o=(i=(n=e==null?void 0:e.captions)==null?void 0:n.playerCaptionsTracklistRenderer)==null?void 0:i.captionTracks;return o?o.map(r=>{var a;return{id:r.baseUrl,language:r.languageCode,label:((a=r.name)==null?void 0:a.simpleText)||r.languageCode,isAuto:r.kind==="asr"}}):[]}async getSubtitle(e){try{let n=await(await fetch(e)).text();return this.parseToCommon(n)}catch(o){return console.error("[Videoo Notee] YouTube \u5B57\u5E55\u83B7\u53D6\u5931\u8D25:",o),[]}}async getCurrentSubtitle(){let e=document.querySelector(".ytp-caption-window-container");if(e){let o=e.querySelectorAll(".ytp-caption-segment");return Array.from(o).map(n=>n.textContent).join(" ")}return""}parseToCommon(e){let i=new DOMParser().parseFromString(e,"text/xml").querySelectorAll("text");return Array.from(i).map(r=>{let a=parseFloat(r.getAttribute("start"))*1e3,c=parseFloat(r.getAttribute("dur")||"0")*1e3;return{start:a,end:a+c,text:this.decodeHtmlEntities(r.textContent||"")}})}getPlayerResponse(){var o;if(window.ytInitialPlayerResponse)return window.ytInitialPlayerResponse;let e=document.getElementsByTagName("script");for(let n of e){let i=(o=n.textContent)==null?void 0:o.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);if(i)try{return JSON.parse(i[1])}catch{continue}}return null}decodeHtmlEntities(e){let o=document.createElement("textarea");return o.innerHTML=e,o.value}};var R=class extends L{constructor(e={}){super(e),this.platform="bilibili"}matchUrl(e){return/bilibili\.com|b23\.tv/i.test(e)}async getAvailableSubtitles(){var i,r;let e=this.getVideoInfo();if(!e)return[];let{aid:o,cid:n}=e;try{let c=await(await fetch(`https://api.bilibili.com/x/player/v2?aid=${o}&cid=${n}`,{credentials:"include"})).json();return c.code!==0||!((r=(i=c.data)==null?void 0:i.subtitle)!=null&&r.subtitles)?[]:c.data.subtitle.subtitles.map(l=>({id:l.subtitle_url,language:l.lan,label:l.lan_doc,isAuto:l.ai_type>0}))}catch(a){return console.error("[Videoo Notee] B\u7AD9\u5B57\u5E55\u5217\u8868\u83B7\u53D6\u5931\u8D25:",a),[]}}async getSubtitle(e){try{let o=e.startsWith("http")?e:`https:${e}`,i=await(await fetch(o)).json();return this.parseToCommon(i)}catch(o){return console.error("[Videoo Notee] B\u7AD9\u5B57\u5E55\u83B7\u53D6\u5931\u8D25:",o),[]}}async getCurrentSubtitle(){let e=document.querySelector(".bpx-player-subtitle-panel-text");return e&&e.textContent||""}parseToCommon(e){return e!=null&&e.body?e.body.map(o=>({start:o.from*1e3,end:o.to*1e3,text:o.content})):[]}getVideoInfo(){var r,a,c,l,d;if(window.__INITIAL_STATE__){let s=window.__INITIAL_STATE__;return{aid:s.aid||((r=s.videoData)==null?void 0:r.aid),bvid:s.bvid||((a=s.videoData)==null?void 0:a.bvid),cid:s.cid||((c=s.videoData)==null?void 0:c.cid)}}let o=window.location.href.match(/BV[\w]+/i),n=o?o[0]:null,i=document.getElementsByTagName("script");for(let s of i){let p=(l=s.textContent)==null?void 0:l.match(/"aid"\s*:\s*(\d+)/),m=(d=s.textContent)==null?void 0:d.match(/"cid"\s*:\s*(\d+)/);if(p&&m)return{aid:p[1],cid:m[1],bvid:n}}return null}};var h=null,X=null,V={assetsFolder:"assets"};async function le(){try{let t=await Re();if(t&&await t.queryPermission({mode:"readwrite"})==="granted")return h=t,await G(),console.log("[Videoo Notee] \u5DF2\u6062\u590D\u4FDD\u5B58\u76EE\u5F55\u6743\u9650"),!0}catch(t){console.log("[Videoo Notee] \u65E0\u6CD5\u6062\u590D\u76EE\u5F55\u6743\u9650:",t)}return!1}async function de(){try{return h=await window.showDirectoryPicker({mode:"readwrite",startIn:"documents"}),await Oe(h),await G(),console.log("[Videoo Notee] \u5DF2\u9009\u62E9\u4FDD\u5B58\u76EE\u5F55:",h.name),!0}catch(t){if(t.name==="AbortError")return console.log("[Videoo Notee] \u7528\u6237\u53D6\u6D88\u9009\u62E9\u76EE\u5F55"),!1;throw console.error("[Videoo Notee] \u9009\u62E9\u76EE\u5F55\u5931\u8D25:",t),t}}async function G(){if(h)try{let t=await xe();X=await h.getDirectoryHandle(t.assetsFolder||V.assetsFolder,{create:!0}),console.log("[Videoo Notee] Assets \u6587\u4EF6\u5939\u5DF2\u5C31\u7EEA")}catch(t){console.error("[Videoo Notee] \u521B\u5EFA assets \u6587\u4EF6\u5939\u5931\u8D25:",t)}}async function ue(t,e){if(!h)throw new Error("\u8BF7\u5148\u9009\u62E9\u4FDD\u5B58\u76EE\u5F55");try{let o=ge(t)+".md",i=await(await h.getFileHandle(o,{create:!0})).createWritable();return await i.write(e),await i.close(),console.log("[Videoo Notee] \u7B14\u8BB0\u5DF2\u4FDD\u5B58:",o),o}catch(o){throw console.error("[Videoo Notee] \u4FDD\u5B58\u7B14\u8BB0\u5931\u8D25:",o),o}}async function pe(t,e){if(!X)throw new Error("\u8BF7\u5148\u9009\u62E9\u4FDD\u5B58\u76EE\u5F55");try{let n=await(await fetch(t)).blob(),i=t.includes("image/png")?".png":".jpg",r=ge(e)+i,c=await(await X.getFileHandle(r,{create:!0})).createWritable();await c.write(n),await c.close();let d=(await xe()).assetsFolder||V.assetsFolder;return console.log("[Videoo Notee] \u622A\u56FE\u5DF2\u4FDD\u5B58:",r),`${d}/${r}`}catch(o){throw console.error("[Videoo Notee] \u4FDD\u5B58\u622A\u56FE\u5931\u8D25:",o),o}}async function fe(){if(!h)return[];let t=[];try{for await(let e of h.values())if(e.kind==="file"&&e.name.endsWith(".md")){let o=await e.getFile();t.push({name:e.name,title:e.name.replace(".md",""),lastModified:o.lastModified})}t.sort((e,o)=>o.lastModified-e.lastModified)}catch(e){console.error("[Videoo Notee] \u5217\u51FA\u7B14\u8BB0\u5931\u8D25:",e)}return t}async function me(t){if(!h)throw new Error("\u8BF7\u5148\u9009\u62E9\u4FDD\u5B58\u76EE\u5F55");try{return await(await(await h.getFileHandle(t)).getFile()).text()}catch(e){throw console.error("[Videoo Notee] \u8BFB\u53D6\u7B14\u8BB0\u5931\u8D25:",e),e}}async function ve(t){if(!h)throw new Error("\u672A\u9009\u62E9\u76EE\u5F55");try{let e=t.split("/"),o=h;for(let r=0;r<e.length-1;r++)o=await o.getDirectoryHandle(e[r]);let n=e[e.length-1];return await(await o.getFileHandle(n)).getFile()}catch(e){return console.error("[Videoo Notee] \u8BFB\u53D6\u8D44\u6E90\u5931\u8D25:",t,e),null}}function he(){return h!==null}function C(){return(h==null?void 0:h.name)||null}function ge(t){return t.replace(/[<>:"/\\|?*]/g,"_").replace(/\s+/g,"_").substring(0,200)}var De="videoo-notee-fs",Pe=1,T="handles";function be(){return new Promise((t,e)=>{let o=indexedDB.open(De,Pe);o.onerror=()=>e(o.error),o.onsuccess=()=>t(o.result),o.onupgradeneeded=n=>{let i=n.target.result;i.objectStoreNames.contains(T)||i.createObjectStore(T)}})}async function Oe(t){try{let o=(await be()).transaction(T,"readwrite");o.objectStore(T).put(t,"rootDir"),await o.complete}catch(e){console.error("[Videoo Notee] \u4FDD\u5B58\u76EE\u5F55\u53E5\u67C4\u5931\u8D25:",e)}}async function Re(){try{let o=(await be()).transaction(T,"readonly").objectStore(T);return new Promise((n,i)=>{let r=o.get("rootDir");r.onsuccess=()=>n(r.result),r.onerror=()=>i(r.error)})}catch(t){return console.error("[Videoo Notee] \u83B7\u53D6\u76EE\u5F55\u53E5\u67C4\u5931\u8D25:",t),null}}async function xe(){try{return(await chrome.storage.local.get("fileSystemConfig")).fileSystemConfig||V}catch{return V}}async function ye(t){try{await chrome.storage.local.set({fileSystemConfig:{...V,...t}}),t.assetsFolder&&h&&await G()}catch(e){console.error("[Videoo Notee] \u4FDD\u5B58\u914D\u7F6E\u5931\u8D25:",e)}}var b=null;function qe(t){b&&b.remove(),b=document.createElement("div"),b.className="vn-directory-dialog-overlay";let e=b.attachShadow({mode:"open"}),o=document.createElement("style");o.textContent=Ue(),e.appendChild(o);let n=document.createElement("div");n.className="vn-dialog",n.innerHTML=`
        <div class="vn-dialog-header">
            <h2>\u9009\u62E9\u7B14\u8BB0\u4FDD\u5B58\u4F4D\u7F6E</h2>
        </div>
        <div class="vn-dialog-body">
            <p class="vn-dialog-desc">\u60A8\u7684\u7B14\u8BB0\u4EE5\u7EAF Markdown \u683C\u5F0F\u4FDD\u5B58\u5728\u60A8\u7684\u8BA1\u7B97\u673A\u4E0A</p>
            
            <div class="vn-folder-selector">
                <span class="vn-folder-path" id="folder-path">\u9009\u62E9\u6587\u4EF6\u5939</span>
                <button class="vn-btn-folder" id="btn-select-folder">\u{1F4C1}</button>
            </div>
            
            <div class="vn-assets-config">
                <label>
                    <span>\u622A\u56FE\u4FDD\u5B58\u5B50\u76EE\u5F55</span>
                    <input type="text" id="assets-folder" value="assets" placeholder="assets">
                </label>
            </div>
            
            <ul class="vn-features">
                <li>\u{1F512} \u5B8C\u5168\u79BB\u7EBF\u2014\u6570\u636E\u4E0D\u4F1A\u79BB\u5F00\u60A8\u7684\u8BBE\u5907</li>
                <li>\u{1F4DD} \u7B14\u8BB0\u5728 Obsidian \u7B49\u5E94\u7528\u4E2D\u5373\u65F6\u6253\u5F00</li>
                <li>\u{1F5BC}\uFE0F \u622A\u56FE\u81EA\u52A8\u4FDD\u5B58\u5230\u5B50\u76EE\u5F55</li>
            </ul>
        </div>
        <div class="vn-dialog-footer">
            <button class="vn-btn vn-btn-cancel" id="btn-cancel">\u53D6\u6D88</button>
            <button class="vn-btn vn-btn-primary" id="btn-confirm" disabled>\u9009\u62E9\u6587\u4EF6\u5939</button>
        </div>
    `,e.appendChild(n),document.body.appendChild(b);let i=e.getElementById("folder-path"),r=e.getElementById("btn-select-folder"),a=e.getElementById("assets-folder"),c=e.getElementById("btn-cancel"),l=e.getElementById("btn-confirm"),d=!1,s=async()=>{try{await de()&&(d=!0,i.textContent=C(),i.classList.add("selected"),l.disabled=!1,l.textContent="\u786E\u8BA4")}catch(m){console.error("\u9009\u62E9\u76EE\u5F55\u5931\u8D25:",m),i.textContent="\u9009\u62E9\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"}};r.addEventListener("click",s),i.addEventListener("click",s),c.addEventListener("click",()=>{b.remove(),b=null,t&&t(!1)}),l.addEventListener("click",async()=>{if(!d)return;let m=a.value.trim()||"assets";await ye({assetsFolder:m}),b.remove(),b=null,t&&t(!0)});let p=m=>{m.key==="Escape"&&(b.remove(),b=null,document.removeEventListener("keydown",p),t&&t(!1))};document.addEventListener("keydown",p)}async function J(){return he()?!0:new Promise(t=>{qe(t)})}function Ue(){return`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :host {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .vn-dialog {
            background: #1e1e2e;
            border-radius: 16px;
            width: 90%;
            max-width: 480px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .vn-dialog-header {
            padding: 24px 24px 0;
        }
        
        .vn-dialog-header h2 {
            color: #cdd6f4;
            font-size: 22px;
            font-weight: 600;
        }
        
        .vn-dialog-body {
            padding: 24px;
        }
        
        .vn-dialog-desc {
            color: #a6adc8;
            font-size: 14px;
            margin-bottom: 24px;
            line-height: 1.5;
        }
        
        .vn-folder-selector {
            display: flex;
            align-items: center;
            background: #313244;
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 16px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
        }
        
        .vn-folder-selector:hover {
            background: #45475a;
            border-color: #89b4fa;
        }
        
        .vn-folder-path {
            flex: 1;
            color: #6c7086;
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .vn-folder-path.selected {
            color: #cdd6f4;
            font-weight: 500;
        }
        
        .vn-btn-folder {
            width: 36px;
            height: 36px;
            border: none;
            background: #45475a;
            border-radius: 8px;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .vn-btn-folder:hover {
            background: #585b70;
        }
        
        .vn-assets-config {
            margin-bottom: 20px;
        }
        
        .vn-assets-config label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #a6adc8;
            font-size: 14px;
        }
        
        .vn-assets-config input {
            width: 150px;
            padding: 8px 12px;
            background: #313244;
            border: 1px solid #45475a;
            border-radius: 8px;
            color: #cdd6f4;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .vn-assets-config input:focus {
            border-color: #89b4fa;
        }
        
        .vn-features {
            list-style: none;
            margin-top: 16px;
        }
        
        .vn-features li {
            color: #89b4fa;
            font-size: 14px;
            padding: 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .vn-dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 16px 24px;
            background: #181825;
        }
        
        .vn-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .vn-btn-cancel {
            background: transparent;
            color: #a6adc8;
        }
        
        .vn-btn-cancel:hover {
            background: #313244;
            color: #cdd6f4;
        }
        
        .vn-btn-primary {
            background: #89b4fa;
            color: #1e1e2e;
        }
        
        .vn-btn-primary:hover:not(:disabled) {
            background: #b4befe;
        }
        
        .vn-btn-primary:disabled {
            background: #45475a;
            color: #6c7086;
            cursor: not-allowed;
        }
    `}var E=null;async function we(t){E&&E.remove();let e=await fe();E=document.createElement("div"),E.className="vn-file-dialog-overlay";let o=E.attachShadow({mode:"open"}),n=document.createElement("style");n.textContent=He(),o.appendChild(n);let i=document.createElement("div");i.className="vn-dialog",i.innerHTML=`
        <div class="vn-dialog-header">
            <h2>\u6253\u5F00\u7B14\u8BB0</h2>
            <button class="vn-btn-close">\xD7</button>
        </div>
        <div class="vn-dialog-body">
            <div class="vn-search-box">
                <input type="text" id="file-search" placeholder="\u641C\u7D22\u6587\u4EF6...">
            </div>
            <div class="vn-file-list" id="file-list">
                <!-- \u6587\u4EF6\u5217\u8868\u5C06\u5728\u8FD9\u91CC\u6E32\u67D3 -->
            </div>
        </div>
    `,o.appendChild(i),document.body.appendChild(E);let r=(s="")=>{let p=o.getElementById("file-list");p.innerHTML="";let m=e.filter(g=>g.title.toLowerCase().includes(s.toLowerCase()));if(m.length===0){p.innerHTML='<div class="vn-empty-state">\u6CA1\u6709\u627E\u5230\u6587\u4EF6</div>';return}m.forEach(g=>{let w=document.createElement("div");w.className="vn-file-item";let F=new Date(g.lastModified),_e=F.toLocaleDateString()+" "+F.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});w.innerHTML=`
                <div class="vn-file-info">
                    <div class="vn-file-title">${g.title}</div>
                    <div class="vn-file-date">${_e}</div>
                </div>
                <button class="vn-btn-open">\u6253\u5F00</button>
            `,w.addEventListener("click",()=>{l(),t&&t(g)}),p.appendChild(w)})};r();let a=o.getElementById("file-search"),c=o.querySelector(".vn-btn-close");a.addEventListener("input",s=>{r(s.target.value)});let l=()=>{E.remove(),E=null,document.removeEventListener("keydown",d)};c.addEventListener("click",l);let d=s=>{s.key==="Escape"&&l()};document.addEventListener("keydown",d),setTimeout(()=>a.focus(),100)}function He(){return`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :host {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .vn-dialog {
            background: #1e1e2e;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            height: 80vh; /* \u56FA\u5B9A\u9AD8\u5EA6\uFF0C\u5185\u90E8\u6EDA\u52A8 */
            max-height: 600px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            animation: slideIn 0.2s ease;
            color: #cdd6f4;
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        
        .vn-dialog-header {
            padding: 16px 20px;
            border-bottom: 1px solid #313244;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .vn-dialog-header h2 {
            font-size: 18px;
            font-weight: 600;
        }
        
        .vn-btn-close {
            background: transparent;
            border: none;
            color: #a6adc8;
            font-size: 24px;
            cursor: pointer;
            line-height: 1;
        }
        
        .vn-btn-close:hover {
            color: #f38ba8;
        }
        
        .vn-dialog-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 16px;
        }
        
        .vn-search-box {
            margin-bottom: 16px;
        }
        
        .vn-search-box input {
            width: 100%;
            padding: 10px 14px;
            background: #313244;
            border: 1px solid #45475a;
            border-radius: 8px;
            color: #cdd6f4;
            font-size: 14px;
            outline: none;
        }
        
        .vn-search-box input:focus {
            border-color: #89b4fa;
        }
        
        .vn-file-list {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding-right: 4px;
        }
        
        .vn-file-list::-webkit-scrollbar {
            width: 6px;
        }
        
        .vn-file-list::-webkit-scrollbar-thumb {
            background: #45475a;
            border-radius: 3px;
        }
        
        .vn-file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: #181825;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.2s;
        }
        
        .vn-file-item:hover {
            background: #313244;
            border-color: #45475a;
        }
        
        .vn-file-info {
            flex: 1;
            overflow: hidden;
        }
        
        .vn-file-title {
            font-size: 14px;
            color: #cdd6f4;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .vn-file-date {
            font-size: 12px;
            color: #6c7086;
        }
        
        .vn-btn-open {
            padding: 6px 12px;
            background: transparent;
            border: 1px solid #45475a;
            border-radius: 6px;
            color: #89b4fa;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            margin-left: 10px;
        }
        
        .vn-file-item:hover .vn-btn-open {
            background: #89b4fa;
            color: #1e1e2e;
            border-color: #89b4fa;
        }
        
        .vn-empty-state {
            text-align: center;
            color: #6c7086;
            margin-top: 40px;
            font-size: 14px;
        }
    `}var u=null,ne=!1,Q=!1,Z=!1,q={x:0,y:0},N="",S="",U={width:420,height:500,right:20,top:80};async function je(){if(u)return H(),u;if(!await le()&&!await J())return console.log("[Videoo Notee] \u7528\u6237\u53D6\u6D88\u9009\u62E9\u76EE\u5F55"),null;let e=document.createElement("div");e.id="videoo-notee-floating-editor",e.className="vn-floating-editor";let o=e.attachShadow({mode:"open"}),n=document.createElement("style");n.textContent=tt(),o.appendChild(n),S=ie();let i=document.createElement("div");return i.className="vn-editor-wrapper",i.innerHTML=`
        <div class="vn-editor-header">
            <div class="vn-drag-handle">
                <span class="vn-logo">\u{1F4DD}</span>
                <input type="text" class="vn-note-title" value="${S}" placeholder="\u7B14\u8BB0\u6807\u9898">
            </div>
            <div class="vn-header-controls">
                <span class="vn-save-status" title="\u4FDD\u5B58\u76EE\u5F55">\u{1F4C1} ${C()||"\u672A\u9009\u62E9"}</span>
                <button class="vn-btn vn-btn-focus" title="\u89C6\u9891\u6A21\u5F0F">\u{1F3AC}</button>
                <button class="vn-btn vn-btn-minimize" title="\u6700\u5C0F\u5316">\u2500</button>
                <button class="vn-btn vn-btn-close" title="\u5173\u95ED">\xD7</button>
            </div>
        </div>
        <div class="vn-editor-body">
            <div class="vn-toolbar">
                <button class="vn-tool-btn" data-action="screenshot" title="\u622A\u56FE (Ctrl+Shift+S)">\u{1F4F8}</button>
                <button class="vn-tool-btn" data-action="timestamp" title="\u65F6\u95F4\u6233 (Ctrl+Shift+T)">\u23F1\uFE0F</button>
                <button class="vn-tool-btn" data-action="open" title="\u6253\u5F00\u7B14\u8BB0">\u{1F4DC}</button>
                <button class="vn-tool-btn" data-action="save" title="\u4FDD\u5B58">\u{1F4BE}</button>
                <div class="vn-toolbar-spacer"></div>
                <button class="vn-tool-btn" data-action="folder" title="\u66F4\u6362\u4FDD\u5B58\u76EE\u5F55">\u{1F4C2}</button>
            </div>
            <div class="vn-note-content">
                <div class="vn-live-editor" contenteditable="true" placeholder="\u5728\u8FD9\u91CC\u5199\u7B14\u8BB0..."></div>
            </div>
            <div class="vn-screenshots-bar">
                <div class="vn-screenshots-list"></div>
            </div>
        </div>
        <div class="vn-resize-handles">
            <div class="vn-resize-handle vn-resize-n" data-dir="n"></div>
            <div class="vn-resize-handle vn-resize-s" data-dir="s"></div>
            <div class="vn-resize-handle vn-resize-e" data-dir="e"></div>
            <div class="vn-resize-handle vn-resize-w" data-dir="w"></div>
            <div class="vn-resize-handle vn-resize-nw" data-dir="nw"></div>
            <div class="vn-resize-handle vn-resize-ne" data-dir="ne"></div>
            <div class="vn-resize-handle vn-resize-sw" data-dir="sw"></div>
            <div class="vn-resize-handle vn-resize-se" data-dir="se"></div>
        </div>
    `,o.appendChild(i),i.style.width=U.width+"px",i.style.height=U.height+"px",i.style.right=U.right+"px",i.style.top=U.top+"px",Ye(o,i),document.body.appendChild(e),u={container:e,shadow:o,wrapper:i,liveEditor:o.querySelector(".vn-live-editor"),screenshotsList:o.querySelector(".vn-screenshots-list"),screenshots:[],content:""},ne=!0,u}function Ye(t,e){let o=t.querySelector(".vn-drag-handle"),n=t.querySelector(".vn-btn-close"),i=t.querySelector(".vn-btn-minimize"),r=t.querySelector(".vn-btn-focus"),a=t.querySelectorAll(".vn-resize-handle"),c=t.querySelectorAll(".vn-tool-btn");o.addEventListener("mousedown",s=>{Q=!0;let p=e.getBoundingClientRect();q.x=s.clientX-p.left,q.y=s.clientY-p.top,e.classList.add("vn-dragging"),s.preventDefault()}),document.addEventListener("mousemove",s=>{if(Q){let p=s.clientX-q.x,m=s.clientY-q.y;e.style.left=Math.max(0,p)+"px",e.style.top=Math.max(0,m)+"px",e.style.right="auto"}Z&&We(s,e)}),document.addEventListener("mouseup",()=>{Q=!1,Z=!1,N="",e.classList.remove("vn-dragging"),e.classList.remove("vn-resizing")}),a.forEach(s=>{s.addEventListener("mousedown",p=>{Z=!0,N=s.dataset.dir,e.classList.add("vn-resizing"),p.preventDefault(),p.stopPropagation()})}),n.addEventListener("click",Je),i.addEventListener("click",()=>{e.classList.toggle("vn-minimized")}),r.addEventListener("click",()=>{window.postMessage({type:"VN_ENTER_FOCUS_MODE"},"*")}),c.forEach(s=>{s.addEventListener("mousedown",p=>{p.preventDefault()}),s.addEventListener("click",()=>{let p=s.dataset.action;Ke(p)})});let l=t.querySelector(".vn-live-editor");l.addEventListener("input",()=>{u&&(u.content=l.innerHTML,te())}),l.addEventListener("keydown",s=>{s.stopPropagation()}),l.addEventListener("keyup",s=>{s.stopPropagation()}),l.addEventListener("keypress",s=>{s.stopPropagation()});let d=t.querySelector(".vn-note-title");d&&(d.addEventListener("input",et),d.addEventListener("blur",()=>{d.value.trim()||(d.value=ie(),S=d.value)}),d.addEventListener("keydown",s=>{s.stopPropagation()}),d.addEventListener("keyup",s=>{s.stopPropagation()})),window.addEventListener("message",s=>{if(s.source!==window)return;let{type:p,data:m}=s.data;if(p==="VN_TIMESTAMP_RESULT"){let g=re(m.timestamp),F=`<a href="${Ee(m.videoUrl,m.timestamp)}" class="vn-timestamp-link">${g}</a>&nbsp;`;ke(F),te()}})}function We(t,e){let o=e.getBoundingClientRect(),n=320,i=300,r=o.width,a=o.height,c=o.left,l=o.top;if(N.includes("e")&&(r=Math.max(n,t.clientX-o.left)),N.includes("w")){let d=o.left-t.clientX;r=Math.max(n,o.width+d),r>n&&(c=t.clientX)}if(N.includes("s")&&(a=Math.max(i,t.clientY-o.top)),N.includes("n")){let d=o.top-t.clientY;a=Math.max(i,o.height+d),a>i&&(l=t.clientY)}e.style.width=r+"px",e.style.height=a+"px",e.style.left=c+"px",e.style.top=l+"px",e.style.right="auto"}async function Ke(t){switch(t){case"screenshot":window.postMessage({type:"VN_CAPTURE_SCREENSHOT"},"*");break;case"timestamp":Ge();break;case"open":we(async e=>{try{let o=await me(e.name);if(u&&u.liveEditor){S=e.title;let n=u.shadow.querySelector(".vn-note-title");n&&(n.value=S),u.liveEditor.innerHTML=Ze(o),console.log("[Videoo Notee] \u5DF2\u6253\u5F00\u7B14\u8BB0:",e.name);let i=u.liveEditor.querySelectorAll("img");for(let r of i){let a=r.getAttribute("data-saved-path")||r.getAttribute("src");if(a&&!a.match(/^(http|https|blob|data):/))try{let c=await ve(a);if(c){let l=URL.createObjectURL(c);r.src=l,r.getAttribute("data-saved-path")||r.setAttribute("data-saved-path",a)}}catch{console.warn("\u65E0\u6CD5\u52A0\u8F7D\u56FE\u7247\u8D44\u6E90:",a)}}}}catch(o){console.error("[Videoo Notee] \u6253\u5F00\u7B14\u8BB0\u5931\u8D25:",o)}});break;case"save":await Le();break;case"folder":await J(),oe();break}}function Ee(t,e){try{let o=new URL(t);return o.searchParams.set("t",Math.floor(e).toString()),o.toString()}catch{let n=t.includes("?")?"&":"?";return`${t}${n}t=${Math.floor(e)}`}}async function Se(t,e,o){if(!u)return;let n=re(e),i=`screenshot_${Date.now()}`,r=i;try{r=await pe(t,i),console.log("[Videoo Notee] \u622A\u56FE\u5DF2\u4FDD\u5B58:",r)}catch(d){console.error("[Videoo Notee] \u4FDD\u5B58\u622A\u56FE\u5931\u8D25:",d)}let a={id:`ss_${Date.now()}`,dataUrl:t,savedPath:r,timestamp:e,videoUrl:o,createdAt:Date.now()};u.screenshots.push(a);let c=Ee(o,e),l=`<div class="vn-screenshot-block" data-path="${r}"><img src="${t}" alt="\u622A\u56FE ${n}" class="vn-screenshot-img" data-saved-path="${r}"><a href="${c}" class="vn-timestamp-link">${n}</a></div>`;ke(l),Xe(),te()}function ke(t){if(!u||!u.liveEditor)return;let e=u.shadow.getSelection(),o=!1;if(e.rangeCount>0){let n=e.getRangeAt(0);if(u.liveEditor.contains(n.commonAncestorContainer)){n.deleteContents();let i=document.createElement("div");i.innerHTML=t;let r=document.createDocumentFragment(),a;for(;i.firstChild;)a=i.firstChild,r.appendChild(a);n.insertNode(r),a&&(n.setStartAfter(a),n.collapse(!0),e.removeAllRanges(),e.addRange(n)),o=!0}}o||(u.liveEditor.insertAdjacentHTML("beforeend",t),u.liveEditor.scrollTop=u.liveEditor.scrollHeight)}function Xe(){if(!u)return;let t=u.screenshotsList;t.innerHTML=u.screenshots.map((e,o)=>`
        <img src="${e.dataUrl}" 
             class="vn-screenshot-thumb" 
             data-index="${o}"
             title="${re(e.timestamp)}">
    `).join("")}function Ge(){window.postMessage({type:"VN_GET_TIMESTAMP"},"*")}var ee=null;function te(){ee&&clearTimeout(ee),ee=setTimeout(()=>{Le()},2e3)}async function Le(){if(u)try{let t=Qe(u.liveEditor);await ue(S,t),oe("\u5DF2\u4FDD\u5B58"),console.log("[Videoo Notee] \u7B14\u8BB0\u5DF2\u4FDD\u5B58:",S)}catch(t){console.error("[Videoo Notee] \u4FDD\u5B58\u7B14\u8BB0\u5931\u8D25:",t),oe("\u4FDD\u5B58\u5931\u8D25")}}function H(){if(!u){je();return}u.container.style.display="block",ne=!0}function Je(){u&&(u.container.style.display="none",ne=!1)}function re(t){if(!t&&t!==0)return"--:--";let e=Math.floor(t/3600),o=Math.floor(t%3600/60),n=Math.floor(t%60);return e>0?`${e}:${o.toString().padStart(2,"0")}:${n.toString().padStart(2,"0")}`:`${o}:${n.toString().padStart(2,"0")}`}function ie(){let e=new Date().toISOString().slice(0,10),n=(document.title||"Untitled").replace(/[<>:"/\\|?*]/g,"").replace(/\s+/g," ").trim().substring(0,100);return`${e} ${n}`}function oe(t){if(!u)return;let e=u.shadow.querySelector(".vn-save-status");e&&(t?(e.textContent=`\u2713 ${t}`,e.classList.add("saved"),setTimeout(()=>{e.textContent=`\u{1F4C1} ${C()||"\u672A\u9009\u62E9"}`,e.classList.remove("saved")},2e3)):e.textContent=`\u{1F4C1} ${C()||"\u672A\u9009\u62E9"}`)}function Qe(t){let e="";function o(n){if(n.nodeType===Node.TEXT_NODE)return n.textContent;if(n.nodeType!==Node.ELEMENT_NODE)return"";let i=n.tagName.toLowerCase(),r="";for(let a of n.childNodes)r+=o(a);switch(i){case"div":if(n.classList.contains("vn-screenshot-block")){let d=n.querySelector("img"),s=n.querySelector(".vn-timestamp-link"),p=(d==null?void 0:d.dataset.savedPath)||(d==null?void 0:d.src)||"",m=(s==null?void 0:s.textContent)||"",g=(s==null?void 0:s.href)||"",w=`![\u622A\u56FE ${m}](${p})
`;return g&&(w+=`[${m}](${g})
`),w+`
`}return r+`
`;case"p":return r+`

`;case"br":return`
`;case"strong":case"b":return`**${r}**`;case"em":case"i":return`*${r}*`;case"a":let a=n.getAttribute("href");return`[${r}](${a})`;case"img":let c=n.dataset.savedPath||n.src;return`![${n.alt||"\u56FE\u7247"}](${c})`;case"h1":return`# ${r}

`;case"h2":return`## ${r}

`;case"h3":return`### ${r}

`;case"ul":return r+`
`;case"ol":return r+`
`;case"li":return`- ${r}
`;case"code":return`\`${r}\``;case"pre":return`\`\`\`
${r}
\`\`\`
`;default:return r}}return e=o(t),e=e.replace(/＃/g,"#").replace(/　/g," ").replace(/\u00A0/g," "),e.replace(/\n{3,}/g,`

`).trim()}function Ze(t){if(!t)return"";let e=t,o=[];e=e.replace(/```([\s\S]*?)```/g,(i,r)=>(o.push(r),`__CODE_BLOCK_${o.length-1}__`));let n=/!\[(.*?)\]\((.*?)\)\s*(?:\[(.*?)\]\((.*?)\))?/g;return e=e.replace(n,(i,r,a,c,l)=>{if(r.includes("\u622A\u56FE")||a.includes("assets/")){let s="";return c&&l&&(s=`<a href="${l}" class="vn-timestamp-link">${c}</a>`),`<div class="vn-screenshot-block" data-path="${a}"><img src="${a}" alt="${r}" class="vn-screenshot-img" data-saved-path="${a}">${s}</div>`}return`<img src="${a}" alt="${r}">`}),e=e.replace(/\[(.*?)\]\((.*?)\)/g,'<a href="$2">$1</a>'),e=e.replace(/^### (.*$)/gm,"<h3>$1</h3>"),e=e.replace(/^## (.*$)/gm,"<h2>$1</h2>"),e=e.replace(/^# (.*$)/gm,"<h1>$1</h1>"),e=e.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*(.*?)\*/g,"<em>$1</em>"),e=e.replace(/^\- (.*$)/gm,"<li>$1</li>"),e=e.replace(/(<li>.*<\/li>)/g,"<ul>$1</ul>"),e=e.replace(/\n\n/g,"<br><br>"),e=e.replace(/\n/g,"<br>"),e=e.replace(/__CODE_BLOCK_(\d+)__/g,(i,r)=>`<pre><code>${o[r]}</code></pre>`),e}function et(t){S=t.target.value||ie()}function tt(){return`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .vn-editor-wrapper {
            position: fixed;
            background: #1e1e2e;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #cdd6f4;
            overflow: hidden;
            transition: box-shadow 0.2s;
        }

        .vn-editor-wrapper:hover {
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
        }

        .vn-editor-wrapper.vn-dragging {
            opacity: 0.9;
            cursor: grabbing;
        }

        .vn-editor-wrapper.vn-minimized .vn-editor-body {
            display: none;
        }

        .vn-editor-wrapper.vn-minimized {
            height: auto !important;
        }

        /* Header */
        .vn-editor-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: #181825;
            border-bottom: 1px solid #313244;
            cursor: grab;
        }

        .vn-drag-handle {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }

        .vn-logo {
            font-size: 18px;
        }

        .vn-title {
            font-size: 14px;
            font-weight: 600;
            color: #cba6f7;
        }

        .vn-note-title {
            flex: 1;
            background: transparent;
            border: none;
            color: #cba6f7;
            font-size: 14px;
            font-weight: 600;
            outline: none;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
        }

        .vn-note-title:hover,
        .vn-note-title:focus {
            background: #313244;
        }

        .vn-note-title::placeholder {
            color: #6c7086;
        }

        .vn-save-status {
            font-size: 12px;
            color: #6c7086;
            padding: 4px 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        }

        .vn-save-status.saved {
            color: #a6e3a1;
        }

        .vn-header-controls {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .vn-btn {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            color: #6c7086;
            font-size: 16px;
            cursor: pointer;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .vn-btn:hover {
            background: #313244;
            color: #cdd6f4;
        }

        .vn-btn-close:hover {
            background: #f38ba8;
            color: #1e1e2e;
        }

        .vn-btn-focus:hover {
            background: #89b4fa;
            color: #1e1e2e;
        }

        /* Body */
        .vn-editor-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        /* Toolbar */
        .vn-toolbar {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            gap: 4px;
            background: #1e1e2e;
            border-bottom: 1px solid #313244;
        }

        .vn-tool-btn {
            padding: 6px 10px;
            border: none;
            background: #313244;
            color: #cdd6f4;
            font-size: 14px;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .vn-tool-btn:hover {
            background: #45475a;
        }

        .vn-toolbar-spacer {
            flex: 1;
        }

        /* Note Content */
        .vn-note-content {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .vn-live-editor {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.7;
            outline: none;
            min-height: 200px;
        }

        .vn-live-editor:empty::before {
            content: attr(placeholder);
            color: #6c7086;
        }

        .vn-live-editor img {
            max-width: 100%;
            border-radius: 8px;
            margin: 8px 0;
        }

        .vn-screenshot-block {
            margin: 12px 0;
        }

        .vn-screenshot-img {
            max-width: 100%;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .vn-screenshot-img:hover {
            transform: scale(1.02);
        }

        .vn-timestamp-link {
            display: inline-block;
            margin-top: 4px;
            color: #89b4fa;
            text-decoration: none;
            font-size: 13px;
        }

        .vn-timestamp-link:hover {
            text-decoration: underline;
        }

        /* Screenshots Bar */
        .vn-screenshots-bar {
            padding: 8px 12px;
            background: #181825;
            border-top: 1px solid #313244;
            min-height: 60px;
        }

        .vn-screenshots-list {
            display: flex;
            gap: 8px;
            overflow-x: auto;
        }

        .vn-screenshot-thumb {
            width: 80px;
            height: 45px;
            border-radius: 4px;
            object-fit: cover;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
        }

        .vn-screenshot-thumb:hover {
            border-color: #89b4fa;
            transform: scale(1.05);
        }

        /* Resize Handles */
        .vn-resize-handles {
            position: absolute;
            inset: 0;
            pointer-events: none;
        }

        .vn-resize-handle {
            position: absolute;
            pointer-events: auto;
        }

        .vn-resize-n, .vn-resize-s {
            left: 8px;
            right: 8px;
            height: 6px;
            cursor: ns-resize;
        }

        .vn-resize-n { top: -3px; }
        .vn-resize-s { bottom: -3px; }

        .vn-resize-e, .vn-resize-w {
            top: 8px;
            bottom: 8px;
            width: 6px;
            cursor: ew-resize;
        }

        .vn-resize-e { right: -3px; }
        .vn-resize-w { left: -3px; }

        .vn-resize-nw, .vn-resize-ne, .vn-resize-sw, .vn-resize-se {
            width: 12px;
            height: 12px;
        }

        .vn-resize-nw { top: -3px; left: -3px; cursor: nwse-resize; }
        .vn-resize-ne { top: -3px; right: -3px; cursor: nesw-resize; }
        .vn-resize-sw { bottom: -3px; left: -3px; cursor: nesw-resize; }
        .vn-resize-se { bottom: -3px; right: -3px; cursor: nwse-resize; }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: #45475a;
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #585b70;
        }
    `}var M=!1,k=null,y=null,Te={bilibili:[".bpx-player-container","#bilibili-player",".bilibili-player-area"],youtube:["#movie_player","ytd-player",".html5-video-player"],generic:['[class*="player"]','[class*="video-container"]','[id*="player"]']};function ot(){let t=window.location.hostname;return t.includes("bilibili.com")?"bilibili":t.includes("youtube.com")||t.includes("youtu.be")?"youtube":t.includes("coursera.org")?"coursera":t.includes("udemy.com")?"udemy":"generic"}function nt(){let t=ot(),e=Te[t]||Te.generic;for(let n of e){let i=document.querySelector(n);if(i&&rt(i))return console.log(`[Videoo Notee] \u627E\u5230\u64AD\u653E\u5668: ${n}`),i}let o=document.querySelector("video");if(o){let n=o.parentElement;for(;n&&n!==document.body;){let i=n.getBoundingClientRect();if(i.width>=300&&i.height>=200)return console.log("[Videoo Notee] \u4F7F\u7528 video \u7236\u5BB9\u5668"),n;n=n.parentElement}return o}return null}function rt(t){let e=t.getBoundingClientRect();return e.width>=200&&e.height>=100&&window.getComputedStyle(t).display!=="none"}function se(){if(M){console.log("[Videoo Notee] \u5DF2\u5728\u89C6\u9891\u6A21\u5F0F\u4E2D");return}let t=nt();if(!t){console.error("[Videoo Notee] \u627E\u4E0D\u5230\u89C6\u9891\u64AD\u653E\u5668");return}y={element:t,parent:t.parentElement,nextSibling:t.nextSibling,originalStyles:{position:t.style.position,width:t.style.width,height:t.style.height,top:t.style.top,left:t.style.left,zIndex:t.style.zIndex}},k=it(),k.querySelector(".vn-focus-video-area").appendChild(t),document.body.appendChild(k),document.body.style.overflow="hidden",M=!0,console.log("[Videoo Notee] \u8FDB\u5165\u89C6\u9891\u6A21\u5F0F"),window.postMessage({type:"VN_FOCUS_MODE_ENTERED"},"*")}function A(){if(!M||!y)return;let t=y.element;y.nextSibling?y.parent.insertBefore(t,y.nextSibling):y.parent.appendChild(t);let e=y.originalStyles;t.style.position=e.position,t.style.width=e.width,t.style.height=e.height,t.style.top=e.top,t.style.left=e.left,t.style.zIndex=e.zIndex,k&&(k.remove(),k=null),document.body.style.overflow="",y=null,M=!1,console.log("[Videoo Notee] \u9000\u51FA\u89C6\u9891\u6A21\u5F0F"),window.postMessage({type:"VN_FOCUS_MODE_EXITED"},"*")}function it(){let t=document.createElement("div");t.className="vn-focus-mode-container",t.innerHTML=`
        <div class="vn-focus-controls">
            <button class="vn-focus-btn vn-focus-close" title="\u9000\u51FA\u89C6\u9891\u6A21\u5F0F">\u2715</button>
            <div class="vn-focus-spacer"></div>
            <button class="vn-focus-btn vn-focus-speed-down" title="\u51CF\u901F">\u{1F422}</button>
            <span class="vn-focus-speed-display">1.0x</span>
            <button class="vn-focus-btn vn-focus-speed-up" title="\u52A0\u901F">\u26A1</button>
            <div class="vn-focus-spacer"></div>
            <button class="vn-focus-btn vn-focus-screenshot" title="\u622A\u56FE">\u{1F4F8}</button>
        </div>
        <div class="vn-focus-main">
            <div class="vn-focus-video-area"></div>
            <div class="vn-focus-gutter"></div>
            <div class="vn-focus-editor-area"></div>
        </div>
    `;let e=document.createElement("style");return e.textContent=at(),t.appendChild(e),st(t),t}function st(t){let e=t.querySelector(".vn-focus-close"),o=t.querySelector(".vn-focus-speed-down"),n=t.querySelector(".vn-focus-speed-up"),i=t.querySelector(".vn-focus-speed-display"),r=t.querySelector(".vn-focus-screenshot"),a=t.querySelector(".vn-focus-gutter"),c=t.querySelector(".vn-focus-video-area"),l=t.querySelector(".vn-focus-editor-area");e.addEventListener("click",A),o.addEventListener("click",()=>{let s=Ce();s&&(s.playbackRate=Math.max(.25,s.playbackRate-.25),i.textContent=s.playbackRate.toFixed(2)+"x")}),n.addEventListener("click",()=>{let s=Ce();s&&(s.playbackRate=Math.min(4,s.playbackRate+.25),i.textContent=s.playbackRate.toFixed(2)+"x")}),r.addEventListener("click",()=>{window.postMessage({type:"VN_CAPTURE_SCREENSHOT"},"*")});let d=!1;a.addEventListener("mousedown",s=>{d=!0,s.preventDefault()}),document.addEventListener("mousemove",s=>{if(!d)return;let p=t.getBoundingClientRect(),m=(s.clientX-p.left)/p.width*100,g=Math.min(80,Math.max(20,m));c.style.flex=`0 0 ${g}%`,l.style.flex=`0 0 ${100-g-1}%`}),document.addEventListener("mouseup",()=>{d=!1}),document.addEventListener("keydown",s=>{s.key==="Escape"&&M&&A()})}function Ce(){return k?k.querySelector("video"):document.querySelector("video")}function at(){return`
        .vn-focus-mode-container {
            position: fixed !important;
            inset: 0 !important;
            z-index: 2147483646 !important;
            background: #0a0a0f !important;
            display: flex !important;
            flex-direction: column !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        .vn-focus-controls {
            display: flex !important;
            align-items: center !important;
            padding: 8px 16px !important;
            background: #1a1a2e !important;
            gap: 8px !important;
            border-bottom: 1px solid #313244 !important;
        }

        .vn-focus-btn {
            width: 36px !important;
            height: 36px !important;
            border: none !important;
            background: #313244 !important;
            color: #cdd6f4 !important;
            font-size: 16px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s !important;
        }

        .vn-focus-btn:hover {
            background: #45475a !important;
        }

        .vn-focus-close:hover {
            background: #f38ba8 !important;
            color: #1e1e2e !important;
        }

        .vn-focus-speed-display {
            color: #89b4fa !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            min-width: 50px !important;
            text-align: center !important;
        }

        .vn-focus-spacer {
            flex: 1 !important;
        }

        .vn-focus-main {
            flex: 1 !important;
            display: flex !important;
            min-height: 0 !important;
            padding: 16px !important;
            gap: 0 !important;
        }

        .vn-focus-video-area {
            flex: 0 0 60% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #000 !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            position: relative !important;
        }

        .vn-focus-video-area video,
        .vn-focus-video-area iframe {
            width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
        }

        /* B\u7AD9\u64AD\u653E\u5668\u9002\u914D */
        .vn-focus-video-area .bpx-player-container,
        .vn-focus-video-area #bilibili-player {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
        }

        .vn-focus-video-area .bpx-player-video-wrap {
            width: 100% !important;
            height: 100% !important;
        }

        /* YouTube \u64AD\u653E\u5668\u9002\u914D */
        .vn-focus-video-area #movie_player,
        .vn-focus-video-area .html5-video-player {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
        }

        .vn-focus-gutter {
            width: 8px !important;
            background: transparent !important;
            cursor: col-resize !important;
            transition: background 0.2s !important;
            margin: 0 4px !important;
        }

        .vn-focus-gutter:hover {
            background: rgba(137, 180, 250, 0.3) !important;
        }

        .vn-focus-editor-area {
            flex: 0 0 39% !important;
            background: #1e1e2e !important;
            border-radius: 12px !important;
            overflow: hidden !important;
        }
    `}function Ne(){return M}var f=null,I=null;async function ct(){console.log("[Videoo Notee] \u5185\u5BB9\u811A\u672C\u521D\u59CB\u5316...");let t=window.location.href;if(_.match(t))f=new _,P.registerProvider("youtube",new O);else if(z.match(t))f=new z,P.registerProvider("bilibili",new R);else{console.log("[Videoo Notee] \u672A\u8BC6\u522B\u7684\u5E73\u53F0");return}await f.init(),lt(),$.runtime.onMessage.addListener(vt),window.addEventListener("message",ft),console.log("[Videoo Notee] \u5185\u5BB9\u811A\u672C\u521D\u59CB\u5316\u5B8C\u6210")}function lt(){I&&I.remove(),I=document.createElement("div"),I.id="videoo-notee-toolbar",I.innerHTML=`
    <button id="vn-screenshot" title="\u622A\u56FE (Alt+S)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    </button>
    <button id="vn-note" title="\u6253\u5F00\u7B14\u8BB0 (Alt+N)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    </button>
    <button id="vn-focus" title="\u89C6\u9891\u6A21\u5F0F">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8"/>
        <path d="M12 17v4"/>
      </svg>
    </button>
    <button id="vn-subtitle" title="\u5B57\u5E55">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M7 15h4"/>
        <path d="M13 15h4"/>
        <path d="M7 11h2"/>
        <path d="M13 11h4"/>
      </svg>
    </button>
  `;let t=document.createElement("style");t.textContent=`
    #videoo-notee-toolbar {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(0, 0, 0, 0.8);
      padding: 8px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }
    
    #videoo-notee-toolbar button {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: white;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    #videoo-notee-toolbar button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    #videoo-notee-toolbar button:active {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .vn-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999999;
      animation: vn-fadeIn 0.3s ease;
    }
    
    @keyframes vn-fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,document.head.appendChild(t),document.body.appendChild(I),document.getElementById("vn-screenshot").addEventListener("click",Me),document.getElementById("vn-note").addEventListener("click",Ie),document.getElementById("vn-focus").addEventListener("click",$e),document.getElementById("vn-subtitle").addEventListener("click",dt),document.addEventListener("keydown",pt)}async function Me(){let t=f==null?void 0:f.getVideoElement();if(!t){x("\u672A\u627E\u5230\u89C6\u9891\u5143\u7D20");return}try{let e=await B(t),o=f.getVideoInfo();await $.runtime.sendMessage({type:"SAVE_SCREENSHOT",data:{screenshot:e.dataUrl,timestamp:e.timestamp,videoUrl:o.url,videoTitle:o.title}}),x(`\u5DF2\u622A\u56FE ${Y(e.timestamp)}`)}catch(e){console.error("[Videoo Notee] \u622A\u56FE\u5931\u8D25:",e),x("\u622A\u56FE\u5931\u8D25: "+e.message)}}function Ie(){H()}function $e(){Ne()?A():(se(),setTimeout(()=>{H()},100))}async function dt(){let t=window.location.href,e=P.detectProvider(t);if(!e){x("\u5F53\u524D\u5E73\u53F0\u6682\u4E0D\u652F\u6301\u5B57\u5E55\u63D0\u53D6");return}try{let o=await e.getAvailableSubtitles();if(o.length===0){x("\u672A\u627E\u5230\u53EF\u7528\u5B57\u5E55");return}ut(o,e)}catch(o){console.error("[Videoo Notee] \u83B7\u53D6\u5B57\u5E55\u5931\u8D25:",o),x("\u83B7\u53D6\u5B57\u5E55\u5931\u8D25")}}function ut(t,e){let o=document.getElementById("vn-subtitle-menu");o&&o.remove();let n=document.createElement("div");n.id="vn-subtitle-menu",n.style.cssText=`
    position: fixed;
    bottom: 140px;
    right: 70px;
    background: rgba(0, 0, 0, 0.95);
    border-radius: 8px;
    padding: 8px 0;
    z-index: 9999999;
    min-width: 150px;
  `,t.forEach(r=>{let a=document.createElement("div");a.style.cssText=`
      padding: 8px 16px;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    `,a.textContent=`${r.label}${r.isAuto?" (\u81EA\u52A8)":""}`,a.addEventListener("mouseover",()=>a.style.background="rgba(255,255,255,0.1)"),a.addEventListener("mouseout",()=>a.style.background="transparent"),a.addEventListener("click",async()=>{n.remove();let c=await e.getSubtitle(r.id),l=e.toPlainText(c);await $.runtime.sendMessage({type:"SUBTITLE_LOADED",data:{entries:c,text:l,language:r.language}}),x(`\u5DF2\u52A0\u8F7D\u5B57\u5E55: ${r.label}`)}),n.appendChild(a)}),document.body.appendChild(n);let i=r=>{n.contains(r.target)||(n.remove(),document.removeEventListener("click",i))};setTimeout(()=>document.addEventListener("click",i),100)}function pt(t){t.altKey&&t.key==="s"&&(t.preventDefault(),Me()),t.altKey&&t.key==="n"&&(t.preventDefault(),Ie()),t.altKey&&t.key==="f"&&(t.preventDefault(),$e())}async function ft(t){if(t.source!==window)return;let{type:e,data:o}=t.data;switch(e){case"VN_CAPTURE_SCREENSHOT":await mt();break;case"VN_GET_TIMESTAMP":let n=f==null?void 0:f.getVideoElement(),i=(f==null?void 0:f.getVideoInfo())||{};n&&window.postMessage({type:"VN_TIMESTAMP_RESULT",data:{timestamp:n.currentTime,videoUrl:i.url}},"*");break;case"VN_ENTER_FOCUS_MODE":se();break;case"VN_EXIT_FOCUS_MODE":A();break}}async function mt(){let t=f==null?void 0:f.getVideoElement();if(!t){x("\u672A\u627E\u5230\u89C6\u9891\u5143\u7D20");return}try{let e=await B(t),o=f.getVideoInfo();await $.runtime.sendMessage({type:"SAVE_SCREENSHOT",data:{screenshot:e.dataUrl,timestamp:e.timestamp,videoUrl:o.url,videoTitle:o.title}}),Se(e.dataUrl,e.timestamp,o.url),x(`\u5DF2\u622A\u56FE ${Y(e.timestamp)}`)}catch(e){console.error("[Videoo Notee] \u622A\u56FE\u5931\u8D25:",e),x("\u622A\u56FE\u5931\u8D25: "+e.message)}}async function vt(t,e,o){switch(t.type){case"CAPTURE_VIDEO_FRAME":let n=f==null?void 0:f.getVideoElement();if(n){let r=await B(n);o(r)}else o({error:"\u672A\u627E\u5230\u89C6\u9891\u5143\u7D20"});break;case"GET_VIDEO_INFO":o((f==null?void 0:f.getVideoInfo())||{});break;case"SEEK_TO":let i=f==null?void 0:f.getVideoElement();i&&t.data.time!==void 0?(i.currentTime=t.data.time,o({success:!0})):o({error:"\u65E0\u6CD5\u8DF3\u8F6C"});break}return!0}function x(t,e=2e3){let o=document.createElement("div");o.className="vn-toast",o.textContent=t,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="0",o.style.transform="translateY(-10px)",setTimeout(()=>o.remove(),300)},e)}ct();
