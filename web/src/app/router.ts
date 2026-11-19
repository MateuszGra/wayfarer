import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: () => import('@/features/auth/views/LoginView.vue') },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
    },
    { path: '/start', name: 'start', component: () => import('@/features/onboarding/views/StartView.vue') },
    { path: '/scene', name: 'scene', component: () => import('@/features/scene/views/SceneView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
});
