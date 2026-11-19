<script setup lang="ts">
import BottomNav from '@/shared/components/organisms/BottomNav/BottomNav.vue';

defineOptions({ name: 'App' });
</script>

<template>
  <div class="app">
    <RouterView />
    <BottomNav />
  </div>
</template>

<style scoped>
.app {
  position: relative;
  height: 100%;
  overflow: hidden;
}
</style>
