import createPageApp from './createPageApp';
import BusAdmin from '@/views/BusAdmin.vue';

createPageApp([
  {
    path: '/bus-admin',
    name: 'BusAdmin',
    component: BusAdmin,
    meta: { title: '巴士管理' }
  }
]);
