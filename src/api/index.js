import request from '@/utils/request';
import definitions from './definitions';

/**
 * 由接口注册表自动生成业务 API：
 *   import api from '@/api';
 *   api['user.getUserList']({ params: { page: 1 } })
 *   api.demo.getPosts({ params: { _limit: 3 } })     // 模块分组访问
 *   api.getApiList()                                   // 读取全部接口定义（管理页用）
 *
 * 路径参数写法：path 含 :id 时，调用传 { params: { id: 2 } } 会自动替换。
 */

function fillPath(path, params = {}) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
    const v = params[key];
    if (v === undefined) return `:${key}`;
    delete params[key]; // 已用于路径，不再作为 query 重复发送
    return encodeURIComponent(v);
  });
}

function createCaller(def) {
  return function call(extra = {}) {
    const params = { ...(extra.params || {}) };
    const url = fillPath(def.path, params);
    return request({
      url,
      method: def.method.toLowerCase(),
      params,
      data: extra.data,
      loading: extra.loading,
      noDuplicate: extra.noDuplicate
    });
  };
}

const api = {};
definitions.forEach((def) => {
  api[def.id] = createCaller(def);
  const mod = (api[def.module] = api[def.module] || {});
  const key = def.id.split('.')[1];
  if (!mod[key]) mod[key] = api[def.id];
});

/** 接口清单（含元信息），「系统配置」页展示与在线测试使用 */
api.getApiList = () => definitions;
api.getModules = () => Array.from(new Set(definitions.map((d) => d.module)));

export default api;
export { definitions };
