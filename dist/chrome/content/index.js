var R=typeof browser<"u",ke=typeof chrome<"u"&&!R,m=R?browser:chrome;var Te={async get(t){return m.storage.local.get(t)},async set(t){return m.storage.local.set(t)},async remove(t){return m.storage.local.remove(t)},async clear(){return m.storage.local.clear()}},Le={async download(t){return new Promise((e,o)=>{m.downloads.download(t,n=>{m.runtime.lastError?o(new Error(m.runtime.lastError.message)):e(n)})})}},ne={async query(t){return m.tabs.query(t)},async create(t){return m.tabs.create(t)},async sendMessage(t,e){return m.tabs.sendMessage(t,e)},async getCurrent(){return m.tabs.getCurrent()}},re={getURL(t){return m.runtime.getURL(t)},sendMessage(t){return m.runtime.sendMessage(t)},onMessage:m.runtime.onMessage,get lastError(){return m.runtime.lastError}},Ne={async open(t){return m.sidePanel?m.sidePanel.open(t):ne.create({url:re.getURL("editor/index.html")})},async setOptions(t){if(m.sidePanel)return m.sidePanel.setOptions(t)}},Ce={async executeScript(t){return m.scripting.executeScript(t)}};var M={storage:Te,downloads:Le,tabs:ne,runtime:re,sidePanel:Ne,scripting:Ce,isFirefox:R,isChrome:ke,browserAPI:m};async function $(t,e={}){let{format:o="jpeg",quality:n=.85}=e;if(!t||!(t instanceof HTMLVideoElement))throw new Error("\u65E0\u6548\u7684\u89C6\u9891\u5143\u7D20");if(t.readyState<2)throw new Error("\u89C6\u9891\u5C1A\u672A\u52A0\u8F7D");let r=t.videoWidth,i=t.videoHeight,a=t.currentTime,l=document.createElement("canvas");l.width=r,l.height=i,l.getContext("2d").drawImage(t,0,0,r,i);let c=`image/${o}`,s=l.toDataURL(c,n),p=await new Promise(h=>{l.toBlob(h,c,n)});return{dataUrl:s,blob:p,width:r,height:i,timestamp:a,format:o}}function U(t,e=!1){if(typeof t!="number"||isNaN(t))return"0:00";t=Math.max(0,Math.floor(t));let o=Math.floor(t/3600),n=Math.floor(t%3600/60),r=t%60;return o>0||e?`${o}:${n.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`:`${n}:${r.toString().padStart(2,"0")}`}var H=class{constructor(){this.videoElement=null,this.observers=[]}static match(e){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 match \u65B9\u6CD5")}async init(){this.videoElement=await this.findVideoElement(),this.setupNavigationListener()}async findVideoElement(){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 findVideoElement \u65B9\u6CD5")}getVideoElement(){return this.videoElement}getVideoInfo(){var e,o;return{url:window.location.href,title:document.title,duration:((e=this.videoElement)==null?void 0:e.duration)||0,currentTime:((o=this.videoElement)==null?void 0:o.currentTime)||0}}getEmbedContainer(){return null}getToolbarAnchor(){return this.videoElement}setupNavigationListener(){let e=location.href,o=new MutationObserver(()=>{location.href!==e&&(e=location.href,this.onNavigate(location.href))});o.observe(document.body,{subtree:!0,childList:!0}),this.observers.push(o),window.addEventListener("popstate",()=>{this.onNavigate(location.href)})}onNavigate(e){this.findVideoElement().then(o=>{this.videoElement=o})}destroy(){this.observers.forEach(e=>e.disconnect()),this.observers=[],this.videoElement=null}waitForElement(e,o=5e3){return new Promise(n=>{let r=document.querySelector(e);if(r){n(r);return}let i=new MutationObserver((a,l)=>{let d=document.querySelector(e);d&&(l.disconnect(),n(d))});i.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{i.disconnect(),n(document.querySelector(e))},o)})}},A=H;var I=class extends A{static match(e){return/youtube\.com|youtu\.be/i.test(e)}async findVideoElement(){return await this.waitForElement("video.html5-main-video, video.video-stream")}getVideoInfo(){var r,i;let e=super.getVideoInfo(),o=document.querySelector("h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata"),n=document.querySelector("#channel-name a, ytd-channel-name a");return{...e,title:((r=o==null?void 0:o.textContent)==null?void 0:r.trim())||document.title.replace(" - YouTube",""),channel:((i=n==null?void 0:n.textContent)==null?void 0:i.trim())||"",videoId:this.extractVideoId()}}extractVideoId(){let e=new URL(window.location.href);return e.searchParams.get("v")||e.pathname.split("/").pop()}getEmbedContainer(){return document.querySelector("#secondary, #related")}getToolbarAnchor(){return document.querySelector(".ytp-chrome-bottom")||this.videoElement}getChapters(){let e=[];return document.querySelectorAll("ytd-macro-markers-list-item-renderer").forEach((n,r)=>{var l,d,c,s;let i=(d=(l=n.querySelector("#details h4"))==null?void 0:l.textContent)==null?void 0:d.trim(),a=(s=(c=n.querySelector("#time"))==null?void 0:c.textContent)==null?void 0:s.trim();i&&a&&e.push({index:r,title:i,time:a})}),e}};var V=class extends A{static match(e){return/bilibili\.com/i.test(e)}async findVideoElement(){return await this.waitForElement("video, .bpx-player-video-wrap video")}getVideoInfo(){var r,i;let e=super.getVideoInfo(),o=document.querySelector("h1.video-title, .video-info-title"),n=document.querySelector(".up-name, .username");return{...e,title:((r=o==null?void 0:o.textContent)==null?void 0:r.trim())||document.title.replace("_\u54D4\u54E9\u54D4\u54E9_bilibili",""),uploader:((i=n==null?void 0:n.textContent)==null?void 0:i.trim())||"",...this.getBilibiliIds()}}getBilibiliIds(){var i;let e=window.location.href,o=e.match(/BV[\w]+/i),n=e.match(/av(\d+)/i),r=null;return window.__INITIAL_STATE__&&(r=window.__INITIAL_STATE__.cid||((i=window.__INITIAL_STATE__.videoData)==null?void 0:i.cid)),{bvid:o?o[0]:null,aid:n?n[1]:null,cid:r}}getEmbedContainer(){return document.querySelector("#danmukuBox, .video-info-container, .right-container")}getToolbarAnchor(){return document.querySelector(".bpx-player-control-wrap, .bilibili-player-video-control")||this.videoElement}getCurrentPartInfo(){var n;let e=document.querySelectorAll(".list-box li, .video-pod__item"),o=document.querySelector(".list-box li.on, .video-pod__item.active");return{total:e.length,current:o?Array.from(e).indexOf(o)+1:1,title:((n=o==null?void 0:o.textContent)==null?void 0:n.trim())||""}}getDanmakuState(){let e=document.querySelector(".bpx-player-dm-switch, .bilibili-player-video-danmaku-switch");return{enabled:(e==null?void 0:e.classList.contains("bpx-state-on"))||!1}}};var w=class{constructor(e={}){this.options=e}async getAvailableSubtitles(){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 getAvailableSubtitles \u65B9\u6CD5")}async getSubtitle(e){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 getSubtitle \u65B9\u6CD5")}async getCurrentSubtitle(){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 getCurrentSubtitle \u65B9\u6CD5")}parseToCommon(e){throw new Error("\u5B50\u7C7B\u5FC5\u987B\u5B9E\u73B0 parseToCommon \u65B9\u6CD5")}toPlainText(e,o={}){let{includeTimestamps:n=!1,separator:r=`
`}=o;return e.map(i=>n?`[${this.formatTime(i.start)}] ${i.text}`:i.text).join(r)}formatTime(e){let o=Math.floor(e/1e3),n=Math.floor(o/3600),r=Math.floor(o%3600/60),i=o%60;return n>0?`${n}:${r.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}`:`${r}:${i.toString().padStart(2,"0")}`}},j=class{constructor(){this.providers=new Map}registerProvider(e,o){this.providers.set(e,o)}getProvider(e){return this.providers.get(e)||null}detectProvider(e){for(let[o,n]of this.providers)if(n.matchUrl&&n.matchUrl(e))return n;return null}},F=new j;var B=class extends w{constructor(e={}){super(e),this.platform="youtube"}matchUrl(e){return/youtube\.com|youtu\.be/i.test(e)}async getAvailableSubtitles(){var n,r;let e=this.getPlayerResponse();if(!e)return[];let o=(r=(n=e==null?void 0:e.captions)==null?void 0:n.playerCaptionsTracklistRenderer)==null?void 0:r.captionTracks;return o?o.map(i=>{var a;return{id:i.baseUrl,language:i.languageCode,label:((a=i.name)==null?void 0:a.simpleText)||i.languageCode,isAuto:i.kind==="asr"}}):[]}async getSubtitle(e){try{let n=await(await fetch(e)).text();return this.parseToCommon(n)}catch(o){return console.error("[Videoo Notee] YouTube \u5B57\u5E55\u83B7\u53D6\u5931\u8D25:",o),[]}}async getCurrentSubtitle(){let e=document.querySelector(".ytp-caption-window-container");if(e){let o=e.querySelectorAll(".ytp-caption-segment");return Array.from(o).map(n=>n.textContent).join(" ")}return""}parseToCommon(e){let r=new DOMParser().parseFromString(e,"text/xml").querySelectorAll("text");return Array.from(r).map(i=>{let a=parseFloat(i.getAttribute("start"))*1e3,l=parseFloat(i.getAttribute("dur")||"0")*1e3;return{start:a,end:a+l,text:this.decodeHtmlEntities(i.textContent||"")}})}getPlayerResponse(){var o;if(window.ytInitialPlayerResponse)return window.ytInitialPlayerResponse;let e=document.getElementsByTagName("script");for(let n of e){let r=(o=n.textContent)==null?void 0:o.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);if(r)try{return JSON.parse(r[1])}catch{continue}}return null}decodeHtmlEntities(e){let o=document.createElement("textarea");return o.innerHTML=e,o.value}};var P=class extends w{constructor(e={}){super(e),this.platform="bilibili"}matchUrl(e){return/bilibili\.com|b23\.tv/i.test(e)}async getAvailableSubtitles(){var r,i;let e=this.getVideoInfo();if(!e)return[];let{aid:o,cid:n}=e;try{let l=await(await fetch(`https://api.bilibili.com/x/player/v2?aid=${o}&cid=${n}`,{credentials:"include"})).json();return l.code!==0||!((i=(r=l.data)==null?void 0:r.subtitle)!=null&&i.subtitles)?[]:l.data.subtitle.subtitles.map(d=>({id:d.subtitle_url,language:d.lan,label:d.lan_doc,isAuto:d.ai_type>0}))}catch(a){return console.error("[Videoo Notee] B\u7AD9\u5B57\u5E55\u5217\u8868\u83B7\u53D6\u5931\u8D25:",a),[]}}async getSubtitle(e){try{let o=e.startsWith("http")?e:`https:${e}`,r=await(await fetch(o)).json();return this.parseToCommon(r)}catch(o){return console.error("[Videoo Notee] B\u7AD9\u5B57\u5E55\u83B7\u53D6\u5931\u8D25:",o),[]}}async getCurrentSubtitle(){let e=document.querySelector(".bpx-player-subtitle-panel-text");return e&&e.textContent||""}parseToCommon(e){return e!=null&&e.body?e.body.map(o=>({start:o.from*1e3,end:o.to*1e3,text:o.content})):[]}getVideoInfo(){var i,a,l,d,c;if(window.__INITIAL_STATE__){let s=window.__INITIAL_STATE__;return{aid:s.aid||((i=s.videoData)==null?void 0:i.aid),bvid:s.bvid||((a=s.videoData)==null?void 0:a.bvid),cid:s.cid||((l=s.videoData)==null?void 0:l.cid)}}let o=window.location.href.match(/BV[\w]+/i),n=o?o[0]:null,r=document.getElementsByTagName("script");for(let s of r){let p=(d=s.textContent)==null?void 0:d.match(/"aid"\s*:\s*(\d+)/),h=(c=s.textContent)==null?void 0:c.match(/"cid"\s*:\s*(\d+)/);if(p&&h)return{aid:p[1],cid:h[1],bvid:n}}return null}};var v=null,Y=null,z={assetsFolder:"assets"};async function ie(){try{let t=await ze();if(t&&await t.queryPermission({mode:"readwrite"})==="granted")return v=t,await W(),console.log("[Videoo Notee] \u5DF2\u6062\u590D\u4FDD\u5B58\u76EE\u5F55\u6743\u9650"),!0}catch(t){console.log("[Videoo Notee] \u65E0\u6CD5\u6062\u590D\u76EE\u5F55\u6743\u9650:",t)}return!1}async function se(){try{return v=await window.showDirectoryPicker({mode:"readwrite",startIn:"documents"}),await Ve(v),await W(),console.log("[Videoo Notee] \u5DF2\u9009\u62E9\u4FDD\u5B58\u76EE\u5F55:",v.name),!0}catch(t){if(t.name==="AbortError")return console.log("[Videoo Notee] \u7528\u6237\u53D6\u6D88\u9009\u62E9\u76EE\u5F55"),!1;throw console.error("[Videoo Notee] \u9009\u62E9\u76EE\u5F55\u5931\u8D25:",t),t}}async function W(){if(v)try{let t=await pe();Y=await v.getDirectoryHandle(t.assetsFolder||z.assetsFolder,{create:!0}),console.log("[Videoo Notee] Assets \u6587\u4EF6\u5939\u5DF2\u5C31\u7EEA")}catch(t){console.error("[Videoo Notee] \u521B\u5EFA assets \u6587\u4EF6\u5939\u5931\u8D25:",t)}}async function ae(t,e){if(!v)throw new Error("\u8BF7\u5148\u9009\u62E9\u4FDD\u5B58\u76EE\u5F55");try{let o=de(t)+".md",r=await(await v.getFileHandle(o,{create:!0})).createWritable();return await r.write(e),await r.close(),console.log("[Videoo Notee] \u7B14\u8BB0\u5DF2\u4FDD\u5B58:",o),o}catch(o){throw console.error("[Videoo Notee] \u4FDD\u5B58\u7B14\u8BB0\u5931\u8D25:",o),o}}async function ce(t,e){if(!Y)throw new Error("\u8BF7\u5148\u9009\u62E9\u4FDD\u5B58\u76EE\u5F55");try{let n=await(await fetch(t)).blob(),r=t.includes("image/png")?".png":".jpg",i=de(e)+r,l=await(await Y.getFileHandle(i,{create:!0})).createWritable();await l.write(n),await l.close();let c=(await pe()).assetsFolder||z.assetsFolder;return console.log("[Videoo Notee] \u622A\u56FE\u5DF2\u4FDD\u5B58:",i),`${c}/${i}`}catch(o){throw console.error("[Videoo Notee] \u4FDD\u5B58\u622A\u56FE\u5931\u8D25:",o),o}}function le(){return v!==null}function S(){return(v==null?void 0:v.name)||null}function de(t){return t.replace(/[<>:"/\\|?*]/g,"_").replace(/\s+/g,"_").substring(0,200)}var Me="videoo-notee-fs",Ie=1,E="handles";function ue(){return new Promise((t,e)=>{let o=indexedDB.open(Me,Ie);o.onerror=()=>e(o.error),o.onsuccess=()=>t(o.result),o.onupgradeneeded=n=>{let r=n.target.result;r.objectStoreNames.contains(E)||r.createObjectStore(E)}})}async function Ve(t){try{let o=(await ue()).transaction(E,"readwrite");o.objectStore(E).put(t,"rootDir"),await o.complete}catch(e){console.error("[Videoo Notee] \u4FDD\u5B58\u76EE\u5F55\u53E5\u67C4\u5931\u8D25:",e)}}async function ze(){try{let o=(await ue()).transaction(E,"readonly").objectStore(E);return new Promise((n,r)=>{let i=o.get("rootDir");i.onsuccess=()=>n(i.result),i.onerror=()=>r(i.error)})}catch(t){return console.error("[Videoo Notee] \u83B7\u53D6\u76EE\u5F55\u53E5\u67C4\u5931\u8D25:",t),null}}async function pe(){try{return(await chrome.storage.local.get("fileSystemConfig")).fileSystemConfig||z}catch{return z}}async function me(t){try{await chrome.storage.local.set({fileSystemConfig:{...z,...t}}),t.assetsFolder&&v&&await W()}catch(e){console.error("[Videoo Notee] \u4FDD\u5B58\u914D\u7F6E\u5931\u8D25:",e)}}var g=null;function _e(t){g&&g.remove(),g=document.createElement("div"),g.className="vn-directory-dialog-overlay";let e=g.attachShadow({mode:"open"}),o=document.createElement("style");o.textContent=$e(),e.appendChild(o);let n=document.createElement("div");n.className="vn-dialog",n.innerHTML=`
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
    `,e.appendChild(n),document.body.appendChild(g);let r=e.getElementById("folder-path"),i=e.getElementById("btn-select-folder"),a=e.getElementById("assets-folder"),l=e.getElementById("btn-cancel"),d=e.getElementById("btn-confirm"),c=!1,s=async()=>{try{await se()&&(c=!0,r.textContent=S(),r.classList.add("selected"),d.disabled=!1,d.textContent="\u786E\u8BA4")}catch(h){console.error("\u9009\u62E9\u76EE\u5F55\u5931\u8D25:",h),r.textContent="\u9009\u62E9\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"}};i.addEventListener("click",s),r.addEventListener("click",s),l.addEventListener("click",()=>{g.remove(),g=null,t&&t(!1)}),d.addEventListener("click",async()=>{if(!c)return;let h=a.value.trim()||"assets";await me({assetsFolder:h}),g.remove(),g=null,t&&t(!0)});let p=h=>{h.key==="Escape"&&(g.remove(),g=null,document.removeEventListener("keydown",p),t&&t(!1))};document.addEventListener("keydown",p)}async function X(){return le()?!0:new Promise(t=>{_e(t)})}function $e(){return`
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
    `}var f=null,Z=!1,K=!1,G=!1,D={x:0,y:0},k="",T="",O={width:420,height:500,right:20,top:80};async function Ae(){if(f)return q(),f;if(!await ie()&&!await X())return console.log("[Videoo Notee] \u7528\u6237\u53D6\u6D88\u9009\u62E9\u76EE\u5F55"),null;let e=document.createElement("div");e.id="videoo-notee-floating-editor",e.className="vn-floating-editor";let o=e.attachShadow({mode:"open"}),n=document.createElement("style");n.textContent=je(),o.appendChild(n),T=ee();let r=document.createElement("div");return r.className="vn-editor-wrapper",r.innerHTML=`
        <div class="vn-editor-header">
            <div class="vn-drag-handle">
                <span class="vn-logo">\u{1F4DD}</span>
                <input type="text" class="vn-note-title" value="${T}" placeholder="\u7B14\u8BB0\u6807\u9898">
            </div>
            <div class="vn-header-controls">
                <span class="vn-save-status" title="\u4FDD\u5B58\u76EE\u5F55">\u{1F4C1} ${S()||"\u672A\u9009\u62E9"}</span>
                <button class="vn-btn vn-btn-focus" title="\u89C6\u9891\u6A21\u5F0F">\u{1F3AC}</button>
                <button class="vn-btn vn-btn-minimize" title="\u6700\u5C0F\u5316">\u2500</button>
                <button class="vn-btn vn-btn-close" title="\u5173\u95ED">\xD7</button>
            </div>
        </div>
        <div class="vn-editor-body">
            <div class="vn-toolbar">
                <button class="vn-tool-btn" data-action="screenshot" title="\u622A\u56FE (Ctrl+Shift+S)">\u{1F4F8}</button>
                <button class="vn-tool-btn" data-action="timestamp" title="\u65F6\u95F4\u6233 (Ctrl+Shift+T)">\u23F1\uFE0F</button>
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
    `,o.appendChild(r),r.style.width=O.width+"px",r.style.height=O.height+"px",r.style.right=O.right+"px",r.style.top=O.top+"px",Fe(o,r),document.body.appendChild(e),f={container:e,shadow:o,wrapper:r,liveEditor:o.querySelector(".vn-live-editor"),screenshotsList:o.querySelector(".vn-screenshots-list"),screenshots:[],content:""},Z=!0,f}function Fe(t,e){let o=t.querySelector(".vn-drag-handle"),n=t.querySelector(".vn-btn-close"),r=t.querySelector(".vn-btn-minimize"),i=t.querySelector(".vn-btn-focus"),a=t.querySelectorAll(".vn-resize-handle"),l=t.querySelectorAll(".vn-tool-btn");o.addEventListener("mousedown",s=>{K=!0;let p=e.getBoundingClientRect();D.x=s.clientX-p.left,D.y=s.clientY-p.top,e.classList.add("vn-dragging"),s.preventDefault()}),document.addEventListener("mousemove",s=>{if(K){let p=s.clientX-D.x,h=s.clientY-D.y;e.style.left=Math.max(0,p)+"px",e.style.top=Math.max(0,h)+"px",e.style.right="auto"}G&&Be(s,e)}),document.addEventListener("mouseup",()=>{K=!1,G=!1,k="",e.classList.remove("vn-dragging"),e.classList.remove("vn-resizing")}),a.forEach(s=>{s.addEventListener("mousedown",p=>{G=!0,k=s.dataset.dir,e.classList.add("vn-resizing"),p.preventDefault(),p.stopPropagation()})}),n.addEventListener("click",Re),r.addEventListener("click",()=>{e.classList.toggle("vn-minimized")}),i.addEventListener("click",()=>{window.postMessage({type:"VN_ENTER_FOCUS_MODE"},"*")}),l.forEach(s=>{s.addEventListener("click",()=>{let p=s.dataset.action;Pe(p)})});let d=t.querySelector(".vn-live-editor");d.addEventListener("input",()=>{f&&(f.content=d.innerHTML,he())}),d.addEventListener("keydown",s=>{s.stopPropagation()}),d.addEventListener("keyup",s=>{s.stopPropagation()}),d.addEventListener("keypress",s=>{s.stopPropagation()});let c=t.querySelector(".vn-note-title");c&&(c.addEventListener("input",He),c.addEventListener("blur",()=>{c.value.trim()||(c.value=ee(),T=c.value)}),c.addEventListener("keydown",s=>{s.stopPropagation()}),c.addEventListener("keyup",s=>{s.stopPropagation()}))}function Be(t,e){let o=e.getBoundingClientRect(),n=320,r=300,i=o.width,a=o.height,l=o.left,d=o.top;if(k.includes("e")&&(i=Math.max(n,t.clientX-o.left)),k.includes("w")){let c=o.left-t.clientX;i=Math.max(n,o.width+c),i>n&&(l=t.clientX)}if(k.includes("s")&&(a=Math.max(r,t.clientY-o.top)),k.includes("n")){let c=o.top-t.clientY;a=Math.max(r,o.height+c),a>r&&(d=t.clientY)}e.style.width=i+"px",e.style.height=a+"px",e.style.left=l+"px",e.style.top=d+"px",e.style.right="auto"}async function Pe(t){switch(t){case"screenshot":window.postMessage({type:"VN_CAPTURE_SCREENSHOT"},"*");break;case"timestamp":qe();break;case"save":await ve();break;case"folder":await X(),Q();break}}function De(t,e){try{let o=new URL(t);return o.searchParams.set("t",Math.floor(e).toString()),o.toString()}catch{let n=t.includes("?")?"&":"?";return`${t}${n}t=${Math.floor(e)}`}}async function fe(t,e,o){if(!f)return;let n=ge(e),r=`screenshot_${Date.now()}`,i=r;try{i=await ce(t,r),console.log("[Videoo Notee] \u622A\u56FE\u5DF2\u4FDD\u5B58:",i)}catch(s){console.error("[Videoo Notee] \u4FDD\u5B58\u622A\u56FE\u5931\u8D25:",s)}let a={id:`ss_${Date.now()}`,dataUrl:t,savedPath:i,timestamp:e,videoUrl:o,createdAt:Date.now()};f.screenshots.push(a);let l=De(o,e),d=f.liveEditor,c=`
        <div class="vn-screenshot-block" data-path="${i}">
            <img src="${t}" alt="\u622A\u56FE ${n}" class="vn-screenshot-img" data-saved-path="${i}">
            <a href="${l}" class="vn-timestamp-link">${n}</a>
        </div>
    `;d.innerHTML+=c,d.scrollTop=d.scrollHeight,Oe(),he()}function Oe(){if(!f)return;let t=f.screenshotsList;t.innerHTML=f.screenshots.map((e,o)=>`
        <img src="${e.dataUrl}" 
             class="vn-screenshot-thumb" 
             data-index="${o}"
             title="${ge(e.timestamp)}">
    `).join("")}function qe(){window.postMessage({type:"VN_GET_TIMESTAMP"},"*")}var J=null;function he(){J&&clearTimeout(J),J=setTimeout(()=>{ve()},2e3)}async function ve(){if(f)try{let t=Ue(f.liveEditor);await ae(T,t),Q("\u5DF2\u4FDD\u5B58"),console.log("[Videoo Notee] \u7B14\u8BB0\u5DF2\u4FDD\u5B58:",T)}catch(t){console.error("[Videoo Notee] \u4FDD\u5B58\u7B14\u8BB0\u5931\u8D25:",t),Q("\u4FDD\u5B58\u5931\u8D25")}}function q(){if(!f){Ae();return}f.container.style.display="block",Z=!0}function Re(){f&&(f.container.style.display="none",Z=!1)}function ge(t){if(!t&&t!==0)return"--:--";let e=Math.floor(t/3600),o=Math.floor(t%3600/60),n=Math.floor(t%60);return e>0?`${e}:${o.toString().padStart(2,"0")}:${n.toString().padStart(2,"0")}`:`${o}:${n.toString().padStart(2,"0")}`}function ee(){let e=new Date().toISOString().slice(0,10),n=(document.title||"Untitled").replace(/[<>:"/\\|?*]/g,"").replace(/\s+/g," ").trim().substring(0,100);return`${e} ${n}`}function Q(t){if(!f)return;let e=f.shadow.querySelector(".vn-save-status");e&&(t?(e.textContent=`\u2713 ${t}`,e.classList.add("saved"),setTimeout(()=>{e.textContent=`\u{1F4C1} ${S()||"\u672A\u9009\u62E9"}`,e.classList.remove("saved")},2e3)):e.textContent=`\u{1F4C1} ${S()||"\u672A\u9009\u62E9"}`)}function Ue(t){let e="";function o(n){if(n.nodeType===Node.TEXT_NODE)return n.textContent;if(n.nodeType!==Node.ELEMENT_NODE)return"";let r=n.tagName.toLowerCase(),i="";for(let a of n.childNodes)i+=o(a);switch(r){case"div":if(n.classList.contains("vn-screenshot-block")){let c=n.querySelector("img"),s=n.querySelector(".vn-timestamp-link"),p=(c==null?void 0:c.dataset.savedPath)||(c==null?void 0:c.src)||"",h=(s==null?void 0:s.textContent)||"",C=(s==null?void 0:s.href)||"",oe=`![\u622A\u56FE ${h}](${p})
`;return C&&(oe+=`[${h}](${C})
`),oe+`
`}return i+`
`;case"p":return i+`

`;case"br":return`
`;case"strong":case"b":return`**${i}**`;case"em":case"i":return`*${i}*`;case"a":let a=n.getAttribute("href");return`[${i}](${a})`;case"img":let l=n.dataset.savedPath||n.src;return`![${n.alt||"\u56FE\u7247"}](${l})`;case"h1":return`# ${i}

`;case"h2":return`## ${i}

`;case"h3":return`### ${i}

`;case"ul":return i+`
`;case"ol":return i+`
`;case"li":return`- ${i}
`;case"code":return`\`${i}\``;case"pre":return`\`\`\`
${i}
\`\`\`
`;default:return i}}return e=o(t),e=e.replace(/＃/g,"#").replace(/　/g," ").replace(/\u00A0/g," "),e.replace(/\n{3,}/g,`

`).trim()}function He(t){T=t.target.value||ee()}function je(){return`
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
    `}var L=!1,x=null,y=null,be={bilibili:[".bpx-player-container","#bilibili-player",".bilibili-player-area"],youtube:["#movie_player","ytd-player",".html5-video-player"],generic:['[class*="player"]','[class*="video-container"]','[id*="player"]']};function Ye(){let t=window.location.hostname;return t.includes("bilibili.com")?"bilibili":t.includes("youtube.com")||t.includes("youtu.be")?"youtube":t.includes("coursera.org")?"coursera":t.includes("udemy.com")?"udemy":"generic"}function We(){let t=Ye(),e=be[t]||be.generic;for(let n of e){let r=document.querySelector(n);if(r&&Xe(r))return console.log(`[Videoo Notee] \u627E\u5230\u64AD\u653E\u5668: ${n}`),r}let o=document.querySelector("video");if(o){let n=o.parentElement;for(;n&&n!==document.body;){let r=n.getBoundingClientRect();if(r.width>=300&&r.height>=200)return console.log("[Videoo Notee] \u4F7F\u7528 video \u7236\u5BB9\u5668"),n;n=n.parentElement}return o}return null}function Xe(t){let e=t.getBoundingClientRect();return e.width>=200&&e.height>=100&&window.getComputedStyle(t).display!=="none"}function te(){if(L){console.log("[Videoo Notee] \u5DF2\u5728\u89C6\u9891\u6A21\u5F0F\u4E2D");return}let t=We();if(!t){console.error("[Videoo Notee] \u627E\u4E0D\u5230\u89C6\u9891\u64AD\u653E\u5668");return}y={element:t,parent:t.parentElement,nextSibling:t.nextSibling,originalStyles:{position:t.style.position,width:t.style.width,height:t.style.height,top:t.style.top,left:t.style.left,zIndex:t.style.zIndex}},x=Ke(),x.querySelector(".vn-focus-video-area").appendChild(t),document.body.appendChild(x),document.body.style.overflow="hidden",L=!0,console.log("[Videoo Notee] \u8FDB\u5165\u89C6\u9891\u6A21\u5F0F"),window.postMessage({type:"VN_FOCUS_MODE_ENTERED"},"*")}function _(){if(!L||!y)return;let t=y.element;y.nextSibling?y.parent.insertBefore(t,y.nextSibling):y.parent.appendChild(t);let e=y.originalStyles;t.style.position=e.position,t.style.width=e.width,t.style.height=e.height,t.style.top=e.top,t.style.left=e.left,t.style.zIndex=e.zIndex,x&&(x.remove(),x=null),document.body.style.overflow="",y=null,L=!1,console.log("[Videoo Notee] \u9000\u51FA\u89C6\u9891\u6A21\u5F0F"),window.postMessage({type:"VN_FOCUS_MODE_EXITED"},"*")}function Ke(){let t=document.createElement("div");t.className="vn-focus-mode-container",t.innerHTML=`
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
    `;let e=document.createElement("style");return e.textContent=Je(),t.appendChild(e),Ge(t),t}function Ge(t){let e=t.querySelector(".vn-focus-close"),o=t.querySelector(".vn-focus-speed-down"),n=t.querySelector(".vn-focus-speed-up"),r=t.querySelector(".vn-focus-speed-display"),i=t.querySelector(".vn-focus-screenshot"),a=t.querySelector(".vn-focus-gutter"),l=t.querySelector(".vn-focus-video-area"),d=t.querySelector(".vn-focus-editor-area");e.addEventListener("click",_),o.addEventListener("click",()=>{let s=ye();s&&(s.playbackRate=Math.max(.25,s.playbackRate-.25),r.textContent=s.playbackRate.toFixed(2)+"x")}),n.addEventListener("click",()=>{let s=ye();s&&(s.playbackRate=Math.min(4,s.playbackRate+.25),r.textContent=s.playbackRate.toFixed(2)+"x")}),i.addEventListener("click",()=>{window.postMessage({type:"VN_CAPTURE_SCREENSHOT"},"*")});let c=!1;a.addEventListener("mousedown",s=>{c=!0,s.preventDefault()}),document.addEventListener("mousemove",s=>{if(!c)return;let p=t.getBoundingClientRect(),h=(s.clientX-p.left)/p.width*100,C=Math.min(80,Math.max(20,h));l.style.flex=`0 0 ${C}%`,d.style.flex=`0 0 ${100-C-1}%`}),document.addEventListener("mouseup",()=>{c=!1}),document.addEventListener("keydown",s=>{s.key==="Escape"&&L&&_()})}function ye(){return x?x.querySelector("video"):document.querySelector("video")}function Je(){return`
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
    `}function xe(){return L}var u=null,N=null;async function Qe(){console.log("[Videoo Notee] \u5185\u5BB9\u811A\u672C\u521D\u59CB\u5316...");let t=window.location.href;if(I.match(t))u=new I,F.registerProvider("youtube",new B);else if(V.match(t))u=new V,F.registerProvider("bilibili",new P);else{console.log("[Videoo Notee] \u672A\u8BC6\u522B\u7684\u5E73\u53F0");return}await u.init(),Ze(),M.runtime.onMessage.addListener(it),window.addEventListener("message",nt),console.log("[Videoo Notee] \u5185\u5BB9\u811A\u672C\u521D\u59CB\u5316\u5B8C\u6210")}function Ze(){N&&N.remove(),N=document.createElement("div"),N.id="videoo-notee-toolbar",N.innerHTML=`
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
  `,document.head.appendChild(t),document.body.appendChild(N),document.getElementById("vn-screenshot").addEventListener("click",we),document.getElementById("vn-note").addEventListener("click",Ee),document.getElementById("vn-focus").addEventListener("click",Se),document.getElementById("vn-subtitle").addEventListener("click",et),document.addEventListener("keydown",ot)}async function we(){let t=u==null?void 0:u.getVideoElement();if(!t){b("\u672A\u627E\u5230\u89C6\u9891\u5143\u7D20");return}try{let e=await $(t),o=u.getVideoInfo();await M.runtime.sendMessage({type:"SAVE_SCREENSHOT",data:{screenshot:e.dataUrl,timestamp:e.timestamp,videoUrl:o.url,videoTitle:o.title}}),b(`\u5DF2\u622A\u56FE ${U(e.timestamp)}`)}catch(e){console.error("[Videoo Notee] \u622A\u56FE\u5931\u8D25:",e),b("\u622A\u56FE\u5931\u8D25: "+e.message)}}function Ee(){q()}function Se(){xe()?_():(te(),setTimeout(()=>{q()},100))}async function et(){let t=window.location.href,e=F.detectProvider(t);if(!e){b("\u5F53\u524D\u5E73\u53F0\u6682\u4E0D\u652F\u6301\u5B57\u5E55\u63D0\u53D6");return}try{let o=await e.getAvailableSubtitles();if(o.length===0){b("\u672A\u627E\u5230\u53EF\u7528\u5B57\u5E55");return}tt(o,e)}catch(o){console.error("[Videoo Notee] \u83B7\u53D6\u5B57\u5E55\u5931\u8D25:",o),b("\u83B7\u53D6\u5B57\u5E55\u5931\u8D25")}}function tt(t,e){let o=document.getElementById("vn-subtitle-menu");o&&o.remove();let n=document.createElement("div");n.id="vn-subtitle-menu",n.style.cssText=`
    position: fixed;
    bottom: 140px;
    right: 70px;
    background: rgba(0, 0, 0, 0.95);
    border-radius: 8px;
    padding: 8px 0;
    z-index: 9999999;
    min-width: 150px;
  `,t.forEach(i=>{let a=document.createElement("div");a.style.cssText=`
      padding: 8px 16px;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    `,a.textContent=`${i.label}${i.isAuto?" (\u81EA\u52A8)":""}`,a.addEventListener("mouseover",()=>a.style.background="rgba(255,255,255,0.1)"),a.addEventListener("mouseout",()=>a.style.background="transparent"),a.addEventListener("click",async()=>{n.remove();let l=await e.getSubtitle(i.id),d=e.toPlainText(l);await M.runtime.sendMessage({type:"SUBTITLE_LOADED",data:{entries:l,text:d,language:i.language}}),b(`\u5DF2\u52A0\u8F7D\u5B57\u5E55: ${i.label}`)}),n.appendChild(a)}),document.body.appendChild(n);let r=i=>{n.contains(i.target)||(n.remove(),document.removeEventListener("click",r))};setTimeout(()=>document.addEventListener("click",r),100)}function ot(t){t.altKey&&t.key==="s"&&(t.preventDefault(),we()),t.altKey&&t.key==="n"&&(t.preventDefault(),Ee()),t.altKey&&t.key==="f"&&(t.preventDefault(),Se())}async function nt(t){if(t.source!==window)return;let{type:e,data:o}=t.data;switch(e){case"VN_CAPTURE_SCREENSHOT":await rt();break;case"VN_GET_TIMESTAMP":let n=u==null?void 0:u.getVideoElement(),r=(u==null?void 0:u.getVideoInfo())||{};n&&window.postMessage({type:"VN_TIMESTAMP_RESULT",data:{timestamp:n.currentTime,videoUrl:r.url}},"*");break;case"VN_ENTER_FOCUS_MODE":te();break;case"VN_EXIT_FOCUS_MODE":_();break}}async function rt(){let t=u==null?void 0:u.getVideoElement();if(!t){b("\u672A\u627E\u5230\u89C6\u9891\u5143\u7D20");return}try{let e=await $(t),o=u.getVideoInfo();await M.runtime.sendMessage({type:"SAVE_SCREENSHOT",data:{screenshot:e.dataUrl,timestamp:e.timestamp,videoUrl:o.url,videoTitle:o.title}}),fe(e.dataUrl,e.timestamp,o.url),b(`\u5DF2\u622A\u56FE ${U(e.timestamp)}`)}catch(e){console.error("[Videoo Notee] \u622A\u56FE\u5931\u8D25:",e),b("\u622A\u56FE\u5931\u8D25: "+e.message)}}async function it(t,e,o){switch(t.type){case"CAPTURE_VIDEO_FRAME":let n=u==null?void 0:u.getVideoElement();if(n){let i=await $(n);o(i)}else o({error:"\u672A\u627E\u5230\u89C6\u9891\u5143\u7D20"});break;case"GET_VIDEO_INFO":o((u==null?void 0:u.getVideoInfo())||{});break;case"SEEK_TO":let r=u==null?void 0:u.getVideoElement();r&&t.data.time!==void 0?(r.currentTime=t.data.time,o({success:!0})):o({error:"\u65E0\u6CD5\u8DF3\u8F6C"});break}return!0}function b(t,e=2e3){let o=document.createElement("div");o.className="vn-toast",o.textContent=t,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="0",o.style.transform="translateY(-10px)",setTimeout(()=>o.remove(),300)},e)}Qe();
