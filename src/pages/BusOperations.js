import createPageApp from './createPageApp';
import BusOperations from '@/views/BusOperations.vue';

createPageApp([
  {
    path: '/bus-operations',
    name: 'BusOperations',
    component: BusOperations,
    meta: { title: '运营时刻' }
  }
]);
