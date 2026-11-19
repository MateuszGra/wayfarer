<script setup lang="ts">
defineOptions({ name: 'WorldEmblem' });
</script>

<template>
  <!-- A tiny flat landscape in the world's style: sun, a two-tone mountain, hills and pines. -->
  <svg class="world-emblem" viewBox="0 0 120 52" aria-hidden="true">
    <circle cx="88" cy="17" r="8" class="world-emblem__sun" />
    <polygon points="14,46 44,10 74,46" class="world-emblem__mist" />
    <polygon points="44,10 74,46 52,46 47,30" class="world-emblem__mist-deep" />
    <polygon points="56,46 80,22 106,46" class="world-emblem__mist-deep" />
    <path d="M0 46 Q 30 36 60 44 T 120 42 V 52 H 0 Z" class="world-emblem__pine" />
    <polygon points="22,46 27,32 32,46" class="world-emblem__ink" />
    <polygon points="30,47 34,36 38,47" class="world-emblem__ink" />
    <polygon points="92,45 97,30 102,45" class="world-emblem__ink" />
    <rect x="96.4" y="44" width="1.2" height="3" class="world-emblem__ink" />
  </svg>
</template>

<style scoped>
.world-emblem {
  display: block;
  width: 120px;
  height: 52px;
  margin: 0 auto;
}
.world-emblem__sun {
  fill: var(--sun);
}
.world-emblem__mist {
  fill: var(--mist);
}
.world-emblem__mist-deep {
  fill: var(--mist-deep);
}
.world-emblem__pine {
  fill: var(--pine);
}
.world-emblem__ink {
  fill: var(--ink);
}
</style>
