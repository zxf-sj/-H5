<template>
  <div class="about">
    <div class="about-card">
      <h2 class="about-title">关于本页（LESS 示例）</h2>
      <p class="about-desc">
        本页样式使用 <b>LESS</b> 编写（<code>&lt;style lang="less"&gt;</code>），
        与首页的 SCSS 共存，证明两套预处理器都已接入。
      </p>
      <ul class="about-list">
        <li>构建：Webpack 5</li>
        <li>开发：webpack-dev-server（HMR 热更新）</li>
        <li>打包：单文件 index.html，双击即可打开</li>
      </ul>
      <el-button type="warning" size="small" @click="$router.push('/')">回首页</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About'
};
</script>

<style lang="less">
@brand: #409eff;
@radius: 8px;

.about {
  .about-card {
    background: #fff;
    border-radius: @radius;
    padding: 18px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  }
  .about-title {
    color: @brand;
    font-size: 16px;
    margin-bottom: 10px;
  }
  .about-desc {
    color: #666;
    line-height: 1.8;
    code {
      background: #f0f2f5;
      padding: 1px 6px;
      border-radius: 4px;
    }
  }
  .about-list {
    margin: 12px 0;
    padding-left: 20px;
    line-height: 1.9;
    color: #444;
    li::marker {
      color: @brand;
    }
  }
}
</style>
