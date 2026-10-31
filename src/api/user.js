import api from './index';

/**
 * 业务模块视图层适配（可选写法）：
 * 统一从注册表生成函数中再包一层语义化方法，页面只 import 本模块。
 * 也可以直接 `import api from '@/api'` 使用 api['user.getUserList'](...)。
 */
export function login(data) {
  return api['user.login']({ data, loading: true });
}

export function getUserList(params) {
  return api['user.getUserList']({ params });
}
