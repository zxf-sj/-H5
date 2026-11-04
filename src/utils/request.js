import axios from 'axios';
import { Message, Loading } from 'element-ui';
import { BASE_API, ENABLE_API_LOG } from '@/config/env';
import { ensureLibertyToken, refreshLibertyToken } from '@/utils/liberty-token';

/**
 * Liberty 令牌开关 —— 直接对 DefinePlugin 注入的字面量做比较，
 * 生产构建（.env.production 置 false）时该常量为 false，
 * 下面所有令牌逻辑整块被 terser 死代码消除，产物中不会出现该请求头。
 */
const LIBERTY_ON = process.env.VUE_APP_LIBERTY_TOKEN === 'true';

/**
 * axios 统一封装
 * - baseURL / 超时按环境注入值（.env.[mode] 的 VUE_APP_BASE_API）
 * - 请求拦截：自动带 token、可选 loading、重复请求自动取消、
 *   Liberty_Login_Token（仅测试环境启用，生产构建此逻辑被常量折叠剔除）
 * - 响应拦截：统一业务码处理、错误提示、令牌失效自动刷新重试一次、401 跳登录
 * - 日志：由 VUE_APP_ENABLE_API_LOG 控制
 */

// —— 重复请求管理：同一 method+url+参数 的进行中请求，新请求会取消旧请求 ——
const pendingMap = new Map();

const pendingKey = (config) => {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params || {}), JSON.stringify(data || {})].join('&');
};

const addPending = (config) => {
  const key = pendingKey(config);
  // if (pendingMap.has(key)) {
  //   // 取消上一个同参数的进行中请求
  //   pendingMap.get(key).cancel('重复请求已取消：' + key);
  // }
  config.cancelToken =
    config.cancelToken ||
    new axios.CancelToken((cancel) => {
      pendingMap.set(key, cancel);
    });
};

const removePending = (config) => {
  pendingMap.delete(pendingKey(config));
};

const log = (...args) => {
  if (ENABLE_API_LOG) {
    // eslint-disable-next-line no-console
    console.log('[api]', ...args);
  }
};

const service = axios.create({
  baseURL: BASE_API,
  timeout: 15000,
  // 后端用 Cookie 做身份验证，必须允许携带凭据，否则受保护接口会被 302 到 /Login/Index
  withCredentials: true,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
});

let loadingInstance = null;
let loadingCount = 0;
const openLoading = () => {
  loadingCount += 1;
  loadingInstance = Loading.service({ fullscreen: true, text: '加载中...' });
};
const closeLoading = () => {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0 && loadingInstance) {
    loadingInstance.close();
    loadingInstance = null;
  }
};

service.interceptors.request.use(
  (config) => {
    // 默认开启重复请求取消；单个请求可传 noDuplicate:false 关闭
    if (config.noDuplicate !== false) addPending(config);
    if (config.loading === true) openLoading();

    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const sendLog = () => {
      log('→', config.method.toUpperCase(), (config.baseURL || '') + config.url, {
        params: config.params,
        data: config.data
      });
    };

    // —— 测试环境专属：确保已登录（登录接口会 Set-Cookie 下发 Liberty_Login_Token）。
    //    后端只校验该 Cookie，不认同名请求头，因此这里只等待登录完成、不设置任何头。
    //    生产构建 LIBERTY_ON 折叠为 false，本整块代码被 terser 剔除。——
    if (LIBERTY_ON && !config.skipLibertyToken && !/\/Login\/MobileLogin/i.test(config.url || '')) {
      return ensureLibertyToken().then(
        () => {
          sendLog();
          return config;
        },
        (e) => {
          if (config.noDuplicate !== false) removePending(config);
          if (config.loading === true) closeLoading();
          log('✗ 登录（获取 Liberty_Login_Token Cookie）失败：', e.message);
          Message.error(e.message || '登录令牌获取失败');
          throw e; // 未登录就不发业务请求，避免后端按匿名处理返回 302
        }
      );
    }

    sendLog();
    return config;
  },
  (error) => {
    if (error && error.config) removePending(error.config);
    if (error && error.config && error.config.loading === true) closeLoading();
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    const config = response.config;
    removePending(config);
    if (config.loading === true) closeLoading();

    log('←', response.status, (config.baseURL || '') + config.url, response.data);

    let res = response.data;
    // 部分后端（如 qice）以 text/plain 返回 JSON，axios 不会自动解析，这里兜一下
    if (typeof res === 'string') {
      try {
        res = JSON.parse(res);
      } catch (e) {
        /* 非 JSON 文本，原样返回 */
      }
    }

    // —— 未登录识别：XHR 下浏览器会自动跟随 302，axios 最终拿到的是登录页 HTML（状态码 200）。
    //    不加这段判断的话，业务代码会把整页 HTML 当成数据用，界面表现为空白/错乱且无任何报错。——
    if (typeof res === 'string' && /^\s*</.test(res)) {
      const url = (config.baseURL || '') + config.url;
      if (LIBERTY_ON) {
        // 测试环境：令牌过期或被后端作废，清缓存重新登录后重试一次
        if (!config._libertyRetried) {
          config._libertyRetried = true;
          log('↻ 响应为 HTML（疑似被重定向到登录页），重新登录后重试', url);
          return refreshLibertyToken().then(
            () => service(config),
            () => {
              Message.error('登录态已失效，请重新登录');
              return Promise.reject(new Error('未登录'));
            }
          );
        }
        Message.error('登录态已失效，请重新登录');
        return Promise.reject(new Error('未登录'));
      }
      log('✗ 接口返回 HTML 而非 JSON，通常表示未登录被重定向到登录页：', url);
      Message.error('接口未返回数据（可能未登录或跨域被拦截）');
      return Promise.reject(new Error('接口返回 HTML，疑似未登录'));
    }

    // 后端约定：{ code, data, msg }
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0 || res.code === 200) {
        return res;
      }
      if (res.code === 401) {
        localStorage.removeItem('token');
        Message.error('登录已过期，请重新登录');
        location.hash = '#/login';
        return Promise.reject(new Error('未授权'));
      }
      // 后端（qice）错误提示字段为 msg，兼容 message
      const bizMsg = res.msg || res.message || '请求失败';
      const rejectBiz = () => {
        if (!config.silent) Message.error(bizMsg);
        return Promise.reject(new Error(bizMsg));
      };

      // —— Liberty 令牌可能被后端提前轮换：认证类失败时刷新令牌并重试一次。
      //    生产构建 LIBERTY_ON 恒为 false，本整块被 terser 剔除。——
      if (
        LIBERTY_ON &&
        !config._libertyRetried &&
        (res.code === 403 || /令牌|token|登录|过期|失效|未授权|未登录/i.test(bizMsg))
      ) {
        config._libertyRetried = true;
        return refreshLibertyToken().then(
          () => {
            log('↻ Liberty_Login_Token 已刷新，重试请求', (config.baseURL || '') + config.url);
            return service(config);
          },
          () => rejectBiz() // 刷新失败则继续走原错误提示
        );
      }

      return rejectBiz();
    }
    return res;
  },
  (error) => {
    const config = error.config || {};
    if (config.url) removePending(config);
    if (config.loading === true) closeLoading();

    if (axios.isCancel(error)) {
      // 重复请求取消：静默处理，不打扰用户
      return Promise.reject(error);
    }

    let msg = '网络异常，请稍后重试';
    if (error.response) {
      const map = {
        400: '请求参数错误',
        401: '登录已过期',
        403: '没有权限',
        404: '资源不存在',
        500: '服务器开小差了',
        502: '网关错误',
        503: '服务不可用'
      };
      msg = map[error.response.status] || `请求失败（${error.response.status}）`;
    } else if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
      msg = '请求超时，请检查网络';
    }
    log('✗', msg, (config.baseURL || '') + (config.url || ''));
    if (!config.silent) Message.error(msg);
    return Promise.reject(error);
  }
);

/**
 * 业务侧使用方式：
 *   import request from '@/utils/request';
 *   request({ url: '/user/list', method: 'get', params: { page: 1 } });
 *
 * 扩展配置项：
 *   loading: true      —— 显示全屏 loading
 *   noDuplicate: false —— 关闭重复请求取消（默认开启）
 */
export default service;
export { service as http };
