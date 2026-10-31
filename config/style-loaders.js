const path = require('path');

// SCSS 全局变量文件（编译时自动注入每个 scss 模块，组件内可直接使用 $primary 等变量）
const variablesPath = path
  .resolve(__dirname, '../src/styles/variables.scss')
  .replace(/\\/g, '/');

/**
 * 生成样式 loader 链。
 * @param {boolean} inject  true=style-loader（开发热更新 & 生产内联单文件），false=MiniCssExtractPlugin
 * @param {string} [pre]    预处理器 loader 名：'sass-loader' | 'less-loader'
 */
function styleUse(inject = true, pre) {
  // esModule:false —— vue-loader 15 需要 CommonJS 形式的样式模块导出
  const cssLoader = { loader: 'css-loader', options: { esModule: false } };
  const styleLoader = { loader: 'style-loader', options: { esModule: false } };
  const use = [inject ? styleLoader : require.resolve('mini-css-extract-plugin/dist/loader.js'), cssLoader];
  if (pre === 'sass-loader') {
    use.push({
      loader: 'sass-loader',
      options: {
        api: 'legacy',
        additionalData: (content) => `@import "${variablesPath}";\n${content}`
      }
    });
  } else if (pre === 'less-loader') {
    use.push({
      loader: 'less-loader',
      options: {
        lessOptions: { javascriptEnabled: true }
      }
    });
  }
  return use;
}

module.exports = { styleUse };
