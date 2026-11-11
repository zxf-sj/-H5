const createReleaseConfig = require('./webpack.release');

/**
 * 单页打包配置：
 * 通过 --env page=页面名 指定要打包的页面，产物文件名见 webpack.release.js 的 PAGE_FILES。
 *
 * 用法：
 *   webpack --config config/webpack.page.js --env page=Home          → dist/BusOrderList.html（巴士订单）
 *   webpack --config config/webpack.page.js --env page=BusAdmin      → dist/BusLineSiteMgr.html（巴士管理）
 *   webpack --config config/webpack.page.js --env page=BusOrderFlow  → dist/CreateBusOrder.html（巴士下单）
 *   webpack --config config/webpack.page.js --env page=BusOperations → dist/BusCapacity.html（巴士运营）
 */
module.exports = (env = {}) => {
  let page = env.page || env.PAGE || env.pageName;
  if (Array.isArray(page)) page = page[0];
  if (!page) {
    throw new Error(
      '缺少页面参数，请使用 --env page=<Home|BusAdmin|BusOrderFlow|BusOperations>'
    );
  }
  // eslint-disable-next-line no-console
  console.log(`\n[单页打包] page = ${page}\n`);
  return createReleaseConfig(undefined, { page });
};
