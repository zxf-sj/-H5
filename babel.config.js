module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          // 兼容主流移动端 WebView / 桌面浏览器
          chrome: '49',
          ios: '10',
          safari: '10',
          edge: '13'
        }
      }
    ]
  ]
};
