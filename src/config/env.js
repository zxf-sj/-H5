/**
 * 运行时环境信息（由构建时 DefinePlugin 注入的 process.env 派生）
 * 业务代码统一从这里读取环境，不要散落各处直接写 process.env。
 */
const env = process.env || {};

export const APP_ENV = env.VUE_APP_ENV || 'development'; // development | test | production
export const IS_DEV = APP_ENV === 'development';
export const IS_TEST = APP_ENV === 'test';
export const IS_PROD = APP_ENV === 'production';

/** 接口基础地址：开发 /api（走 devServer 代理）；test/prod 由 .env 决定 */
export const BASE_API = env.VUE_APP_BASE_API || '/api';

/** 是否打印接口日志（.env 开关） */
export const ENABLE_API_LOG = String(env.VUE_APP_ENABLE_API_LOG) === 'true';

/**
 * Liberty_Login_Token（测试环境专属请求头）
 * enabled=true 时每个业务请求自动携带该头；生产 .env 里置 false 即完全不参与打包逻辑。
 */
export const LIBERTY_TOKEN_ENABLED = String(env.VUE_APP_LIBERTY_TOKEN) === 'true';
export const LIBERTY_ACCOUNT = env.VUE_APP_LIBERTY_ACCOUNT || '';
export const LIBERTY_PASSWORD = env.VUE_APP_LIBERTY_PASSWORD || '';
/** 令牌本地缓存时长（分钟）：后端 30~40 分钟轮换，取 35 偏保守 */
export const LIBERTY_TTL_MINUTES = Number(env.VUE_APP_LIBERTY_TTL_MINUTES) || 35;

/** 构建环境名与构建时间（用于「系统配置」页展示、线上问题排查） */
export const BUILD_INFO = {
  mode: env.__MODE__ || 'development',
  buildTime: env.__BUILD_TIME__ || '（开发模式无构建时间）',
  env: APP_ENV,
  baseApi: BASE_API
};

export const ENV_OPTIONS = [
  { value: 'development', label: '开发环境', desc: '本地 devServer + 接口代理' },
  { value: 'test', label: '测试环境', desc: '连接测试服，npm run build:test' },
  { value: 'production', label: '生产环境', desc: '正式发布，npm run build' }
];

export default {
  APP_ENV,
  IS_DEV,
  IS_TEST,
  IS_PROD,
  BASE_API,
  ENABLE_API_LOG,
  BUILD_INFO,
  ENV_OPTIONS
};
