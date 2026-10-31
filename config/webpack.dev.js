const { merge } = require('webpack-merge');
const webpack = require('webpack');
const common = require('./webpack.common.js');
const { styleUse } = require('./style-loaders');
const { loadEnv, envDefinePlugin } = require('./load-env');

// 开发环境：读取 .env.development
const env = loadEnv('development');

// 样式用 style-loader（注入 JS），随 HMR 热更新
module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  module: {
    rules: [
      { test: /\.css$/i, use: styleUse(true) },
      { test: /\.(scss|sass)$/i, use: styleUse(true, 'sass-loader') },
      { test: /\.less$/i, use: styleUse(true, 'less-loader') }
    ]
  },
  plugins: [envDefinePlugin(env)],
  devServer: {
    static: false,
    port: 8080,
    host: '0.0.0.0',
    hot: true, // 模块热替换（热更新）
    open: true, // 启动后自动打开浏览器
    compress: true,
    allowedHosts: 'all',
    historyApiFallback: true,
    client: {
      overlay: { errors: true, warnings: false }
    },
    // 接口代理：前端请求 /api/xxx → DEV_PROXY_TARGET/xxx，解决开发跨域
    proxy: {
      '/api': {
        target: env.DEV_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/api': '' },
        onProxyReq: (proxyReq, req) => {
          // eslint-disable-next-line no-console
          console.log(`[proxy] ${req.method} ${req.originalUrl} -> ${env.DEV_PROXY_TARGET}${proxyReq.path}`);
        }
      }
    }
  }
});
