const path = require('path');
const { merge } = require('webpack-merge');
const { loadEnv } = require('./load-env');
const createReleaseConfig = require('./webpack.release');

// 测试环境打包：读取 .env.test，产物与生产一致（自包含单文件），
// 区别仅在于注入的接口地址、vConsole、日志开关等环境常量。
// 产物单独输出到 dist-test/，不与生产包互相覆盖。
// 用法：npm run build:test
module.exports = merge(createReleaseConfig(loadEnv('test')), {
  output: { path: path.resolve(__dirname, '..', 'dist-test') }
});
