import axios from 'axios';
import { LIBERTY_TOKEN_ENABLED, LIBERTY_ACCOUNT, LIBERTY_PASSWORD, LIBERTY_TTL_MINUTES, BASE_API } from '@/config/env';

/**
 * Liberty_Login_Token 令牌管理（仅测试/开发环境启用，生产打包不注入）
 *
 * 认证机制（已实测确认）：
 * - 调 /Login/MobileLogin（account/password 由 .env 配置）登录后，
 *   后端通过响应头 Set-Cookie 下发 Liberty_Login_Token；
 * - 受保护接口（如 /BusOrder/*）只校验这个 Cookie：
 *     带 Cookie            → 200
 *     只带同名请求头        → 302 跳 /Login/Index
 *     什么都不带            → 302 跳 /Login/Index
 *   所以本模块的职责是「确保已登录、Cookie 在浏览器里」，而不是去拼请求头；
 * - 令牌有效期 30~40 分钟在变，本地按 TTL（默认 35 分钟）缓存返回值用于判活：
 *   未过期直接复用已有 Cookie，过期自动重新登录换新 Cookie —— 并发请求共享同一次登录；
 * - 用裸 axios 调登录，不走 request.js 拦截器，天然避免死循环。
 *
 * 前提：BASE_API 必须与页面同源（开发下走 /api devServer 代理），
 * 否则跨域响应里的 Set-Cookie 存不下来，整套认证都会失效。
 */

const STORAGE_KEY = 'liber…oken';
const STORAGE_TS_KEY = 'liber…e_at';

let memoryCache = null; // sessionStorage 不可用时兜底（file:// 等场景）
let pendingPromise = null; // 并发去重：多个请求同时过期只登录一次

const ttlMs = () => LIBERTY_TTL_MINUTES * 60 * 1000;

function readStorage() {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY);
    const expireAt = Number(sessionStorage.getItem(STORAGE_TS_KEY) || 0);
    if (token !== null && Date.now() < expireAt) return { token, expireAt };
  } catch (e) {
    /* file:// 等无 sessionStorage 场景，忽略 */
  }
  if (memoryCache && Date.now() < memoryCache.expireAt) return memoryCache;
  return null;
}

function writeStorage(token) {
  const expireAt = Date.now() + ttlMs();
  memoryCache = { token, expireAt };
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
    sessionStorage.setItem(STORAGE_TS_KEY, String(expireAt));
  } catch (e) {
    /* 忽略 */
  }
  return memoryCache;
}

/** 强制丢弃缓存（令牌被后端提前作废时用） */
export function clearLibertyToken() {
  memoryCache = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_TS_KEY);
  } catch (e) {
    /* 忽略 */
  }
}

/** 强制刷新：清缓存并立即重新登录取新令牌（返回新令牌） */
export async function refreshLibertyToken() {
  clearLibertyToken();
  return ensureLibertyToken();
}

async function doLogin() {
  // 必须走同源 BASE_API（开发下为 /api 代理）。
  // 若这里直连 https://qice.lebian.xyz，登录虽能成功，但 Set-Cookie 属于跨域响应，
  // 浏览器不会把令牌存到 localhost，后续业务请求就带不上 Cookie → 被 302 到 /Login/Index。
  const url = BASE_API.replace(/\/+$/, '') + '/Login/MobileLogin';
  const resp = await axios.get(url, {
    params: { account: LIBERTY_ACCOUNT, password: LIBERTY_PASSWORD },
    timeout: 15000,
    withCredentials: true // 同源下可省，跨域部署时确保 Cookie 能带上/存下
  });
  let res = resp.data;
  if (typeof res === 'string') {
    try {
      res = JSON.parse(res);
    } catch (e) {
      /* 非 JSON 按失败处理 */
    }
  }
  if (!res || typeof res !== 'object' || (res.code !== 0 && res.code !== 200)) {
    throw new Error('获取 Liberty_Login_Token 失败：' + ((res && res.msg) || '登录接口异常'));
  }
  // 按约定：data 即令牌值（若后端 data 为空会原样带上空串，可看控制台核对）
  const token = res.data === undefined || res.data === null ? '' : String(res.data);
  if (token === '') {
    // eslint-disable-next-line no-console
    console.warn('[liberty-token] 登录成功但接口返回的 data 为空，请确认后端是否在 data 中下发令牌');
  }
  return writeStorage(token).token;
}

/**
 * 获取当前有效令牌：有缓存用缓存，过期自动重新登录。
 * 未启用（生产包）时直接返回 null。
 */
export async function ensureLibertyToken() {
  if (!LIBERTY_TOKEN_ENABLED) return null;
  const cached = readStorage();
  if (cached) return cached.token;
  if (!pendingPromise) {
    pendingPromise = doLogin().finally(() => {
      pendingPromise = null;
    });
  }
  return pendingPromise;
}

/** 令牌状态（「系统配置」页展示用） */
export function libertyTokenStatus() {
  const cached = readStorage();
  return {
    enabled: LIBERTY_TOKEN_ENABLED,
    hasToken: !!cached,
    token: cached ? cached.token : '',
    expireAt: cached ? new Date(cached.expireAt).toLocaleTimeString('zh-CN', { hour12: false }) : ''
  };
}
