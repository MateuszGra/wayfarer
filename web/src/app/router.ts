import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/scene' },
    { path: '/scene', name: 'scene', component: () => import('@/features/scene/views/SceneView.vue') },
    { path: '/map', name: 'map', component: () => import('@/features/map/views/MapView.vue') },
    { path: '/journal', name: 'journal', component: () => import('@/features/journal/views/JournalView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/features/settings/views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/scene' },
  ],
});
