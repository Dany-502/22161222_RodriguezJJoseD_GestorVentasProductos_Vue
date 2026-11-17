import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/productos',
    },
    {
      path: '/productos',
      name: 'productos',
      component: () => import('@/views/productos.views.vue'),
    },
    {
      path: '/ventas',
      name: 'ventas',
      component: () => import('@/views/ventas.views.vue'),
    },
  ],
})

export default router
