import Vue from 'vue';
import VueRouter from 'vue-router';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

import App from '@/App.vue';
import '@/styles/index.scss';

// 规避重复导航报错（与 src/router/index.js 保持一致）
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch((err) => err);
};

/**
 * 单页构建的共享启动函数：
 * 每个页面入口只注册自己的路由，打包时不会把其它页面组件带进产物。
 *
 * @param {Array} routes 仅包含当前页面的一条路由
 * @param {string} [baseTitle] 页面标题后缀
 */
export default function createPageApp(routes, baseTitle = 'H5 后台') {
  Vue.use(ElementUI, { size: 'small' });
  Vue.use(VueRouter);
  Vue.config.productionTip = false;

  const home = routes[0];
  // 首页路由本身就是 '/' 时无需再加重定向，避免死循环
  const rootRoute = home.path === '/' ? [] : [{ path: '/', redirect: home.path }];
  const router = new VueRouter({
    mode: 'hash',
    routes: [
      ...rootRoute,
      ...routes,
      { path: '*', redirect: home.path }
    ]
  });

  router.afterEach((to) => {
    document.title = to.meta && to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle;
  });

  new Vue({
    router,
    render: (h) => h(App)
  }).$mount('#app');
}
