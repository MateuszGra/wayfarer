import { createRouter, createWebHistory, type RouteLocationRaw, type Router } from 'vue-router';
import { useSession } from '@/shared/composables/useSession';
import { useJourney } from '@/shared/composables/useJourney';

declare module 'vue-router' {
  interface RouteMeta {
    /** Only for a signed-in player; others are sent to sign in first. */
    requiresAuth?: boolean;
    /** Only for a signed-out visitor; a signed-in player goes on to the game. */
    guestOnly?: boolean;
    /** Needs a planned journey; without one the player plans it first. */
    requiresJourney?: boolean;
    /** The journey planner: once a journey is planned, only reachable to change it (`?change`). */
    planner?: boolean;
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
        meta: { requiresAuth: true, planner: true },
        component: () => import('@/features/onboarding/views/StartView.vue'),
      },
      {
        path: '/scene',
        name: 'scene',
        meta: { requiresAuth: true, requiresJourney: true },
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
    if (to.meta.guestOnly && account) return '/scene';
    if (!account) return true;
    // The game is about the journey: without one the player plans it, and a planned one is kept.
    const journey = await useJourney().ensure();
    if (to.meta.requiresJourney && !journey) return '/start';
    if (to.meta.planner && journey && !('change' in to.query)) return '/scene';
    return true;
  });

  return router;
}

export const router = createAppRouter();
