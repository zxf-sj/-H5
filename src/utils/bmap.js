/**
 * 百度地图 GL 加载器（巴士管理页地图选点用）
 *
 * 背景：后台原有的入口脚本 https://pass-api.ibtmap.com/.../api 内部用 document.write
 * 去加载真正的 getscript，document.write 在非解析期执行会清空页面，所以：
 *   1) public/index.html 里解析期引入入口脚本（快路径，正常网络下 BMapGL 直接就绪）；
 *   2) 若入口脚本被拦/没加载出来，这里用 fetch 自己拉 getscript 再以「内联脚本」执行
 *      （getscript 内部只用 createElement 加载子模块，不含 document.write，内联是安全的）。
 *
 * 用法：
 *   import loadBMapGL from '@/utils/bmap'
 *   const BMapGL = await loadBMapGL()   // BMapGL.Map 已可用
 */
const KEY = 'XvvI1pZrWNvSAhblxNcyP6w';
const SERVICE_HOST = 'https://pass-api.ibtmap.com/b/_BMapService';
const ENTRY = `${SERVICE_HOST}/api?v=3.0&type=webgl&key=${KEY}`;
const BMAP_CSS = 'https://api.map.baidu.com/res/webgl/10/bmap.css';

const isReady = () => window.BMapGL && window.BMapGL.Map;

function waitFor(timeout) {
  return new Promise((resolve, reject) => {
    if (isReady()) {
      resolve(window.BMapGL);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      if (isReady()) {
        clearInterval(timer);
        resolve(window.BMapGL);
        return;
      }
      if (Date.now() - start > timeout) {
        clearInterval(timer);
        reject(new Error('地图脚本未加载'));
      }
    }, 100);
  });
}

// 兜底：直接拉 getscript 并内联执行
async function injectByFetch() {
  const entryText = await fetch(ENTRY).then((res) => res.text());
  const matched = entryText.match(/src="([^"]+getscript[^"]+)"/);
  const scriptSrc = matched
    ? matched[1]
    : `${SERVICE_HOST}/getscript?key=${KEY}&type=webgl&v=1.0&services=`;

  // 入口脚本里这两处全局配置，跳过它执行时要自己补上
  window._BMapSecurityConfig = window._BMapSecurityConfig || {
    serviceHost: SERVICE_HOST,
  };
  window._FUCK_KEY_ = window._FUCK_KEY_ || KEY;
  window.BMAP_PROTOCOL = 'https';
  window.BMapGL_loadScriptTime =
    window.BMapGL_loadScriptTime || new Date().getTime();

  if (!document.querySelector('link[data-bmapgl-ui]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.setAttribute('data-bmapgl-ui', 'gl');
    link.href = BMAP_CSS;
    document.head.appendChild(link);
  }

  const code = await fetch(scriptSrc).then((res) => res.text());
  if (isReady()) return; // 拉取期间入口脚本自己好了，就别重复执行
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.text = code;
  document.head.appendChild(script);
}

let loading = null;

export default function loadBMapGL() {
  if (isReady()) return Promise.resolve(window.BMapGL);
  if (loading) return loading;

  loading = (async () => {
    // 1) 等 public/index.html 里的入口脚本（正常情况几秒内就绪）
    try {
      return await waitFor(6000);
    } catch (e) {
      // 2) 快路径失败：自己拉主脚本内联执行
      await injectByFetch();
      return await waitFor(12000);
    }
  })().catch((err) => {
    loading = null; // 允许「重试」重新走一遍
    const blocked = !window._BMapSecurityConfig;
    throw new Error(
      blocked
        ? '地图入口脚本没有加载（可能被网络/浏览器扩展拦截），请检查能否访问 pass-api.ibtmap.com'
        : '地图主脚本没有执行成功，请检查网络后重试'
    );
  });

  return loading;
}
