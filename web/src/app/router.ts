import { createRouter, createWebHistory, type RouteLocationRaw, type Router } from 'vue-router';
import { useSession } from '@/shared/composables/useSession';
import { signedInHome } from '@/shared/composables/usePlan';

declare module 'vue-router' {
  interface RouteMeta {
    /** Only for a signed-in player; others are sent to sign in first. */
    requiresAuth?: boolean;
    /** Only for a signed-out visitor; a signed-in player goes on to the game. */
    guestOnly?: boolean;
  }
}

export function createAppRouter(history = createWebHistory()): Router {
  const router = createRouter({
    history,
    routes: [
      { path: '/', redirect: '/login' },
      {
        path: '/login',
        name: 'login',
        meta: { guestOnly: true },
        component: () => import('@/features/auth/views/LoginView.vue'),
      },
      {
        path: '/forgot-password',
        name: 'forgot-password',
        meta: { guestOnly: true },
        component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
      },
      {
        path: '/start',
        name: 'start',
        meta: { requiresAuth: true },
        component: () => import('@/features/onboarding/views/StartView.vue'),
      },
      {
        path: '/scene',
        name: 'scene',
        meta: { requiresAuth: true },
        component: () => import('@/features/scene/views/SceneView.vue'),
      },
      { path: '/:pathMatch(.*)*', redirect: '/login' },
    ],
  });

  router.beforeEach(async (to): Promise<RouteLocationRaw | true> => {
    if (!to.meta.requiresAuth && !to.meta.guestOnly) return true;
    const account = await useSession().ensure();
    // The address asked for is kept, so after signing in the player lands where they meant to go.
    if (to.meta.requiresAuth && !account) return { path: '/login', query: { redirect: to.fullPath } };
    if (to.meta.guestOnly && account) return signedInHome();
    return true;
  });

  return router;
}

export const router = createAppRouter();
