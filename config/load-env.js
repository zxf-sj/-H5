const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

/**
 * 加载 .env.<mode> 环境文件（mode: development | test | production）
 * 返回用于注入 process.env 的键值对（NODE_ENV + VUE_APP_* + DEV_PROXY_TARGET）
 */
function loadEnv(mode) {
  const file = path.resolve(__dirname, '..', `.env.${mode}`);
  if (!fs.existsSync(file)) {
    throw new Error(`缺少环境文件：${file}（可选 development / test / production）`);
  }
  const parsed = dotenv.parse(fs.readFileSync(file));
  const env = {};
  Object.keys(parsed).forEach((key) => {
    if (
      key === 'NODE_ENV' ||
      key === 'DEV_PROXY_TARGET' ||
      key.startsWith('VUE_APP_')
    ) {
      env[key] = parsed[key];
    }
  });
  env.__MODE__ = mode;
  env.__BUILD_TIME__ = new Date().toLocaleString('zh-CN', { hour12: false });
  return env;
}

/**
 * 生成 DefinePlugin：逐键替换 process.env.XXX（vue-cli 同款做法），
 * 未在 .env 中声明的变量保持原样，避免整体替换引发第三方库读取异常。
 */
function envDefinePlugin(env) {
  return new webpack.DefinePlugin({
    'process.env': Object.keys(env).reduce((prev, key) => {
      prev[key] = JSON.stringify(env[key]);
      return prev;
    }, {})
  });
}

module.exports = { loadEnv, envDefinePlugin };
