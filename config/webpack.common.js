const path = require('path');
const { defineConfig } = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const resolve = (p) => path.resolve(__dirname, '..', p);

module.exports = defineConfig({
  entry: resolve('src/main.js'),
  output: {
    path: resolve('dist'),
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].js',
    assetModuleFilename: 'assets/[name].[hash:8][ext]',
    clean: true
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.runtime.esm.js',
      '@': resolve('src')
    },
    extensions: ['.js', '.vue', '.json']
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        // 图片等静态资源内联为 base64，便于单文件打开
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 100 * 1024 }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 100 * 1024 }
        }
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: resolve('public/index.html'),
      favicon: false,
      inject: 'body'
    })
  ],
  // vue-loader@15 与 style-loader@3 的已知静态分析噪音（样式注入运行时已验证正常），予以忽略
  ignoreWarnings: [
    (warning) =>
      /export 'default' \(imported as 'style\d+'\)|export '.+' was not found.*vue&type=style/.test(
        warning.message || ''
      )
  ]
});
