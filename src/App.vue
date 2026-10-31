<template>
  <div id="app">
    <!-- <div class="app-header">
      <h1 class="app-title">{{ title }}</h1>
      <el-menu
        :default-active="$route.path"
        mode="horizontal"
        router
        background-color="#2d3a4b"
        text-color="#cfd8e3"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/about">关于（LESS）</el-menu-item>
        <el-menu-item index="/demo">接口 Demo</el-menu-item>
        <el-menu-item index="/settings">系统配置</el-menu-item>
      </el-menu>
    </div> -->

    <main class="app-main">
      <!-- 路由视图：keep-alive 缓存页面状态 -->
      <keep-alive>
        <router-view />
      </keep-alive>
    </main>

    <!-- <footer class="app-footer">
      Vue 2 · Vue Router · ElementUI · Axios · Sass/Less · Webpack HMR
    </footer> -->
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      title: 'H5 后台管理系统',
    }
  },
}
</script>

<style lang="scss" scoped>
.app-header {
  background: $header-bg;
  padding: 12px 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.app-title {
  color: #fff;
  font-size: 18px;
  margin: 0 0 10px;
}
.app-main {
  padding: 16px;
  min-height: calc(100vh - 152px);
  box-sizing: border-box;
}
.app-footer {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 16px;
}
</style>
