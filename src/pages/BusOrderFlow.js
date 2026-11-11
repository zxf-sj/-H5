import createPageApp from './createPageApp';
import BusOrderFlow from '@/views/BusOrderFlow.vue';

createPageApp([
  {
    path: '/bus-order',
    name: 'BusOrderFlow',
    component: BusOrderFlow,
    meta: { title: '巴士下单' }
  }
]);
