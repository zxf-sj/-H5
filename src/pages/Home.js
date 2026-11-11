import createPageApp from './createPageApp';
import Home from '@/views/Home.vue';

createPageApp([
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '巴士订单' }
  }
]);
