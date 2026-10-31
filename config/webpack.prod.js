const createReleaseConfig = require('./webpack.release');

// 生产环境打包：读取 .env.production
// 产物 dist/index.html 为自包含单文件，可直接双击用 file:// 打开（路由 hash 模式）。
module.exports = createReleaseConfig();
