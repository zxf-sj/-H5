const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require('./webpack.common.js');
const { styleUse } = require('./style-loaders');
const { loadEnv, envDefinePlugin } = require('./load-env');

/**
 * 单页打包映射表：页面名 → 产物文件名
 * - Home.vue          → BusOrderList.html      巴士订单
 * - BusAdmin.vue      → BusLineSiteMgr.html    巴士管理
 * - BusOrderFlow.vue  → CreateBusOrder.html    巴士下单
 * - BusOperations.vue → BusCapacity.html       巴士运营
 */
const PAGE_FILES = {
  Home: 'BusOrderList.html',
  BusAdmin: 'BusLineSiteMgr.html',
  BusOrderFlow: 'CreateBusOrder.html',
  BusOperations: 'BusCapacity.html'
};

/**
 * 发布配置工厂（test / production / 单页 共用）：
 * - 样式走 style-loader（CSS 打进 JS），图片/字体转 base64
 * - LimitChunkCountPlugin 合并所有分包
 * - InlineHtmlAssetsPlugin 把 main.js 内联进 HTML，得到自包含单文件
 * 产物可直接双击用 file:// 打开（路由用 hash 模式）。
 *
 * @param {object} [env] 环境常量对象；缺省读取 .env.production
 * @param {{ page?: string }} [options] 单页打包选项；
 *   options.page 传页面名（见 PAGE_FILES）时，
 *   入口改为 src/pages/<page>.js，产物输出为 dist/<PAGE_FILES[page]>（自包含单文件），
 *   只包含该页面自身的代码，不含其它页面组件。
 */
function createReleaseConfig(env, options) {
  const finalEnv = env || loadEnv('production');
  const page = options && options.page;

  // 单页打包：换入口，并用映射表里的文件名覆盖 common 里的 index.html 模板输出
  let base = common;
  const pageOverrides = {};
  if (page) {
    if (!PAGE_FILES[page]) {
      throw new Error(
        `未知页面：${page}，可选：${Object.keys(PAGE_FILES).join(' / ')}`
      );
    }
    base = {
      ...common,
      plugins: common.plugins.filter((p) => !(p instanceof HtmlWebpackPlugin))
    };
    pageOverrides.entry = path.resolve(__dirname, `../src/pages/${page}.js`);
    // 各页面产物共存于 dist，不能像全量打包那样清空输出目录
    pageOverrides.output = { clean: false };
    pageOverrides.plugins = [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../public/index.html'),
        filename: PAGE_FILES[page],
        inject: 'body'
      })
    ];
  }

  class InlineHtmlAssetsPlugin {
    apply(compiler) {
      const { Compilation, sources } = compiler.webpack;
      compiler.hooks.thisCompilation.tap('InlineHtmlAssetsPlugin', (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'InlineHtmlAssetsPlugin',
            // 必须在 HtmlWebpackPlugin（PROCESS_ASSETS_STAGE_REPORT）生成 HTML 之后再内联
            stage: Compilation.PROCESS_ASSETS_STAGE_REPORT + 100
          },
          (assets) => {
            // 全量打包只有 index.html；单页打包只有 <page>.html
            const htmlName = Object.keys(assets).find((n) => /\.html$/.test(n));
            const jsName = Object.keys(assets).find((n) => /^js\/main[^/]*\.js$/.test(n));
            if (!htmlName || !jsName) return;

            let html = assets[htmlName].source().toString();
            let code = assets[jsName].source().toString();
            // 防止内联脚本被 HTML 解析器提前截断
            code = code.replace(/<\/script/gi, '<\\/script');

            const tagRe = new RegExp(
              `<script[^>]*src="[^"]*${jsName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\??"[^>]*>\\s*</script>`,
              'i'
            );
            if (!tagRe.test(html)) {
              compilation.errors.push(
                new Error('[InlineHtmlAssetsPlugin] 未在 index.html 中找到 main.js 的 script 标签，跳过内联')
              );
              return;
            }
            html = html.replace(tagRe, () => `<script>${code}</script>`);

            assets[htmlName] = new sources.RawSource(html);
            delete assets[jsName];
            // 清理 webpack 默认产出的第三方许可证注释文件
            Object.keys(assets)
              .filter((n) => n.endsWith('.LICENSE.txt'))
              .forEach((n) => delete assets[n]);
          }
        );
      });
    }
  }

  return merge(base, pageOverrides, {
    mode: 'production',
    output: {
      // file:// 打开时，'auto' 会基于 document.baseURI 解析相对资源
      publicPath: 'auto'
    },
    devtool: false,
    performance: { hints: false },
    module: {
      rules: [
        { test: /\.css$/i, use: styleUse(true) },
        { test: /\.(scss|sass)$/i, use: styleUse(true, 'sass-loader') },
        { test: /\.less$/i, use: styleUse(true, 'less-loader') }
      ]
    },
    plugins: [
      envDefinePlugin(finalEnv),
      new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      new InlineHtmlAssetsPlugin()
    ]
  });
}

module.exports = createReleaseConfig;
