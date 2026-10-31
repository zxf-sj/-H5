import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

// 规避重复导航报错
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch((err) => err);
};

const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
  { path: '/bus-admin', name: 'BusAdmin', component: () => import('@/views/BusAdmin.vue'), meta: { title: '巴士管理' } },
  { path: '/about', name: 'About', component: () => import('@/views/About.vue'), meta: { title: '关于' } },
  { path: '/demo', name: 'ApiDemo', component: () => import('@/views/ApiDemo.vue'), meta: { title: '接口 Demo' } },
  { path: '/settings', name: 'Settings', component: () => import('@/views/Settings.vue'), meta: { title: '系统配置' } },
  { path: '*', redirect: '/' }
];

// 生产构建产物会被内联为单文件并用 file:// 直接打开，
// history 模式在 file:// 下不可用，统一使用 hash 模式。
const router = new VueRouter({
  mode: 'hash',
  routes
});

router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - H5 后台`;
  }
});

export default router;
