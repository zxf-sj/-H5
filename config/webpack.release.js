const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { styleUse } = require('./style-loaders');
const { loadEnv, envDefinePlugin } = require('./load-env');

/**
 * 发布配置工厂（test / production 共用）：
 * - 样式走 style-loader（CSS 打进 JS），图片/字体转 base64
 * - LimitChunkCountPlugin 合并所有分包
 * - InlineHtmlAssetsPlugin 把 main.js 内联进 index.html，得到自包含单文件
 * 产物 dist/index.html 可直接双击用 file:// 打开（路由用 hash 模式）。
 *
 * @param {object} [env] 环境常量对象；缺省读取 .env.production
 */
function createReleaseConfig(env) {
  const finalEnv = env || loadEnv('production');

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
            const htmlName = Object.keys(assets).find((n) => /(^|\/)index\.html$/.test(n));
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

  return merge(common, {
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
