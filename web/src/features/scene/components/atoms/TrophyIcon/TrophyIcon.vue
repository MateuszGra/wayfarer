<script setup lang="ts">
import type { TrophyId } from '@shared/achievements/trophies';

export interface Props {
  id: TrophyId;
}

defineOptions({ name: 'TrophyIcon' });
defineProps<Props>();

/** Points of a five-pointed star around (cx, cy), for an SVG polygon. */
function star(cx: number, cy: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}
// San Andreas has six wanted stars; AEZAKMI keeps every one of them empty.
const WANTED_STARS = [16, 32, 48].flatMap((x) => [star(x, 25, 8), star(x, 42, 8)]);
// Pralines in a heart-shaped box, each in a fluted paper cup: [x, y].
const CANDY_CUPS: readonly (readonly [number, number])[] = [
  [24, 30],
  [32, 32],
  [40, 30],
  [28, 39],
  [36, 39],
];
const SUGAR = [18, 23, 28, 33, 38, 43, 47];
// Five songbirds on the hat, one of each species in the game: starling, robin, great tit, chaffinch, sparrow.
const HAT_BIRDS = [
  { x: 15, y: 40, flip: 1, body: 'var(--ink)', head: 'var(--ink)' },
  { x: 22, y: 25, flip: 1, body: 'var(--rust)', head: 'var(--cocoa)' },
  { x: 42, y: 25, flip: -1, body: 'var(--sun)', head: 'var(--ink)' },
  { x: 49, y: 40, flip: -1, body: 'var(--rust-deep)', head: 'var(--mist-deep)' },
  { x: 32, y: 15, flip: 1, body: 'var(--cocoa)', head: 'var(--paper-line)' },
];
// Ten days ticked off on a calendar page, two weeks' rows of five: [x, y] of each box.
const TICKED_DAYS = [27, 38].flatMap((y) => [16, 24, 32, 40, 48].map((x) => [x, y] as const));
</script>

<template>
  <!-- Each trophy is drawn on its own round plate, 64 units across, in the game's flat postcard style. -->
  <svg class="trophy-icon" viewBox="0 0 64 64" aria-hidden="true">
    <template v-if="id === 'aezakmi'">
      <circle cx="32" cy="32" r="30" fill="var(--ink)" />
      <polygon
        v-for="(points, i) in WANTED_STARS"
        :key="i"
        :points="points"
        fill="none"
        stroke="var(--sun)"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="id === 'dragonborn'">
      <circle cx="32" cy="32" r="30" fill="var(--mist)" />
      <polygon points="9,46 32,13 55,46" fill="var(--mist-deep)" />
      <polygon points="25,23 32,13 39,23 35.5,21 32,24 28.5,21" fill="var(--fg)" />
      <!-- The monastery on the summit, and a dragon circling it. -->
      <rect x="29.5" y="9" width="5" height="4" fill="var(--ink)" />
      <polygon points="28.5,9 32,6 35.5,9" fill="var(--ink)" />
      <path d="M40 22 L44.5 16.5 L46.5 19.5 L49.5 14 L51.5 20.5 L47.5 21 L46 24 Z" fill="var(--ink)" />
      <path d="M5 44 L59 44 A30 30 0 0 1 5 44 Z" fill="var(--pine)" />
    </template>

    <template v-else-if="id === 'tenOutOfTen'">
      <circle cx="32" cy="32" r="30" fill="var(--rust)" />
      <rect x="11" y="15" width="42" height="34" rx="3" fill="var(--paper)" />
      <rect x="11" y="15" width="42" height="7" rx="3" fill="var(--ink)" />
      <rect x="18" y="12" width="3" height="7" rx="1.5" fill="var(--paper-line)" />
      <rect x="43" y="12" width="3" height="7" rx="1.5" fill="var(--paper-line)" />
      <path
        v-for="([x, y], i) in TICKED_DAYS"
        :key="i"
        :d="`M${x - 2.6} ${y + 0.4}l2 2.2 3.6-4.6`"
        fill="none"
        stroke="var(--pine)"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="id === 'pikeCaught'">
      <!--
        A pike, the angler's catch: long and lean with a flat duck-bill snout, an olive back, yellow-green
        flanks in rows of pale bean-shaped spots, a cream belly and reddish fins set far back by the tail.
      -->
      <circle cx="32" cy="32" r="30" fill="var(--mist)" />
      <path d="M41 28.2L46.5 22.5L49.5 30Z" fill="var(--rust)" />
      <path d="M41 37.8L46.5 43.5L49.5 36Z" fill="var(--rust)" />
      <path d="M22 37.4L25 41.5L28 37.6Z" fill="var(--rust)" />
      <path d="M50 31L58.5 24.5L56 33L58.5 41.5L50 35Z" fill="var(--rust)" />
      <path
        d="M6 33.5Q10 29.5 19 28.5L40 27.8Q47 28.3 50.5 31.2L50.5 34.8Q47 37.7 40 38.2L19 37.5Q10 36.8 6 33.5Z"
        fill="var(--pike-flank)"
      />
      <path d="M8 32.4Q11 29.6 19 28.5L40 27.8Q47 28.3 50.5 31.2L50.5 31.8Q35 30.2 8 32.4Z" fill="var(--pike-back)" />
      <path d="M7.5 34.5Q10 36.6 19 37.5L40 38.2Q47 37.7 50.5 34.8L50.5 34.6Q32 36.2 7.5 34.5Z" fill="var(--cream)" />
      <ellipse cx="24" cy="31.6" rx="1.7" ry="0.85" fill="var(--pike-spot)" />
      <ellipse cx="29.5" cy="33.6" rx="1.7" ry="0.85" fill="var(--pike-spot)" />
      <ellipse cx="34.5" cy="31.2" rx="1.6" ry="0.8" fill="var(--pike-spot)" />
      <ellipse cx="39.5" cy="33.4" rx="1.5" ry="0.8" fill="var(--pike-spot)" />
      <ellipse cx="44" cy="31.4" rx="1.3" ry="0.7" fill="var(--pike-spot)" />
      <ellipse cx="25" cy="35.2" rx="1.3" ry="0.6" fill="var(--pike-spot)" />
      <path d="M6.5 33.6L13 34" stroke="var(--pike-back)" stroke-width="0.9" stroke-linecap="round" />
      <circle cx="16" cy="31.3" r="1.5" fill="var(--sun)" />
      <circle cx="16.2" cy="31.3" r="0.8" fill="var(--ink)" />
    </template>

    <template v-else-if="id === 'bigfootSeen'">
      <!-- One huge, bare footprint in the dusk. -->
      <circle cx="32" cy="32" r="30" fill="var(--pine)" />
      <ellipse cx="31" cy="39" rx="9" ry="14" fill="var(--paper)" transform="rotate(-8 31 39)" />
      <circle cx="24" cy="21" r="3.6" fill="var(--paper)" />
      <circle cx="30.5" cy="18" r="3.1" fill="var(--paper)" />
      <circle cx="36.5" cy="18.5" r="2.7" fill="var(--paper)" />
      <circle cx="41.5" cy="21" r="2.3" fill="var(--paper)" />
      <circle cx="45" cy="25.5" r="2" fill="var(--paper)" />
    </template>

    <template v-else-if="id === 'lighthouseGlare'">
      <!-- Our lighthouse at night, its lamp turned full on the viewer: a flare of rays round the lantern. -->
      <circle cx="32" cy="32" r="30" fill="var(--ink)" />
      <g fill="var(--sun)" opacity="0.55">
        <path v-for="i in 8" :key="i" d="M32 17L30.6 4h2.8Z" :transform="`rotate(${i * 45} 32 17)`" />
      </g>
      <circle cx="32" cy="17" r="7" fill="var(--sun)" opacity="0.35" />
      <path d="M28 25h8l2.5 28h-13Z" fill="var(--rust)" />
      <path d="M27.4 32h9.2l0.6 6h-10.4ZM26.5 43h11l0.6 6h-12.2Z" fill="var(--paper)" />
      <rect x="25" y="23.5" width="14" height="2" fill="var(--ink)" stroke="var(--paper-line)" stroke-width="0.6" />
      <rect x="28.5" y="14" width="7" height="9.5" fill="var(--cream)" />
      <path d="M27.5 14q4.5-6 9 0Z" fill="var(--paper-line)" />
      <circle cx="32" cy="18.7" r="2.6" fill="var(--paper)" />
      <path d="M5 53h54a30 30 0 0 1-54 0Z" fill="var(--mist-deep)" />
    </template>

    <template v-else-if="id === 'hitchcock'">
      <!-- The wanderer's felt hat with songbirds of every colour crowding onto its brim and crown. -->
      <circle cx="32" cy="32" r="30" fill="var(--mist)" />
      <ellipse cx="32" cy="44" rx="22" ry="5" fill="var(--cocoa)" />
      <path d="M20 44c0-12 4-18 12-18s12 6 12 18Z" fill="var(--cocoa)" />
      <rect x="20" y="38" width="24" height="3.5" fill="var(--rust)" />
      <g v-for="bird in HAT_BIRDS" :key="bird.x" :transform="`translate(${bird.x} ${bird.y}) scale(${bird.flip} 1)`">
        <ellipse cx="0" cy="0" rx="4.2" ry="3" :fill="bird.body" />
        <circle cx="3" cy="-2.6" r="2.2" :fill="bird.head" />
        <path d="M5 -2.8l2.4 0.6l-2.4 0.6Z" fill="var(--ink)" />
        <path d="M-3.5 -0.5l-3.6 1.6l3 0.9Z" :fill="bird.body" />
      </g>
    </template>

    <template v-else-if="id === 'blaviken'">
      <!--
        Two swords crossed behind a silver wolf medallion on its chain: our own drawing in the world's flat
        style, a wink at a certain monster slayer who, after sixty days on the road, stopped shaving.
      -->
      <circle cx="32" cy="32" r="30" fill="var(--ink)" />
      <g v-for="side in [-1, 1]" :key="side" :transform="`rotate(${side * 38} 32 34)`">
        <path d="M30.6 4h2.8v34l-1.4 3-1.4-3Z" fill="var(--mist)" />
        <path d="M32 6v32" stroke="var(--paper)" stroke-width="0.6" opacity="0.7" />
        <rect x="25.5" y="41" width="13" height="2.4" rx="1.2" fill="var(--sun)" />
        <rect x="30.7" y="43.4" width="2.6" height="9" fill="var(--cocoa)" />
        <circle cx="32" cy="54.4" r="2.2" fill="var(--sun)" />
      </g>
      <!-- The chain and the medallion. -->
      <path d="M24 12q8 7 16 0" fill="none" stroke="var(--mist)" stroke-width="1" stroke-dasharray="1.6 1" />
      <circle cx="32" cy="31" r="13" fill="var(--mist-deep)" />
      <circle cx="32" cy="31" r="11.6" fill="var(--mist)" />
      <circle cx="32" cy="31" r="11.6" fill="none" stroke="var(--paper)" stroke-width="0.8" opacity="0.8" />
      <circle cx="32" cy="18.6" r="1.6" fill="none" stroke="var(--mist)" stroke-width="1" />
      <!-- The wolf's head: pricked ears, a heavy brow, narrowed yellow eyes, a long snout and bared fangs. -->
      <path
        d="M23.5 22.5l4 6.5h8l4-6.5l-0.6 8.5l2.6 3.4-4.6 1.2-2.4 5.4h-5l-2.4-5.4-4.6-1.2 2.6-3.4Z"
        fill="var(--ink)"
      />
      <path d="M25 25l2 3.6M39 25l-2 3.6" stroke="var(--mist-deep)" stroke-width="0.9" stroke-linecap="round" />
      <path d="M26.6 31.2l3.6 1.4-3.2 0.6ZM37.4 31.2l-3.6 1.4 3.2 0.6Z" fill="var(--sun)" />
      <path d="M29.6 29.6h4.8" stroke="var(--mist-deep)" stroke-width="0.8" stroke-linecap="round" />
      <path d="M30.6 35h2.8l-1.4 1.6Z" fill="var(--mist-deep)" />
      <path d="M28.6 38.2l1.2 2 0.9-1.4 1.3 1.6 1.3-1.6 0.9 1.4 1.2-2Z" fill="var(--paper)" />
    </template>

    <template v-else-if="id === 'ropuchaSeen'">
      <!--
        Our own toad, round and content, sitting in the green glow of a corner shop's neon at night: a wink
        at a shop on every corner, not any real chain's mark.
      -->
      <circle cx="32" cy="32" r="30" fill="var(--ink)" />
      <rect x="12" y="11" width="40" height="11" rx="3" fill="var(--neon)" opacity="0.25" />
      <rect x="14" y="13" width="36" height="7" rx="2" fill="var(--neon)" />
      <path d="M18 16.5h28" stroke="var(--paper)" stroke-width="1.6" stroke-dasharray="3.2 1.6" />
      <!-- The toad: a broad body, bulging eyes on top, a wide smile and folded legs. -->
      <ellipse cx="32" cy="45" rx="15" ry="9.5" fill="var(--pike-flank)" />
      <ellipse cx="32" cy="48" rx="10" ry="5" fill="var(--cream)" opacity="0.85" />
      <circle cx="24" cy="36" r="4.6" fill="var(--pike-flank)" />
      <circle cx="40" cy="36" r="4.6" fill="var(--pike-flank)" />
      <circle cx="24" cy="35.4" r="2.4" fill="var(--paper)" />
      <circle cx="40" cy="35.4" r="2.4" fill="var(--paper)" />
      <circle cx="24.6" cy="35.6" r="1.2" fill="var(--ink)" />
      <circle cx="39.4" cy="35.6" r="1.2" fill="var(--ink)" />
      <path d="M25 42.5q7 4.5 14 0" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round" />
      <ellipse cx="19" cy="52" rx="5" ry="2.6" fill="var(--pike-back)" />
      <ellipse cx="45" cy="52" rx="5" ry="2.6" fill="var(--pike-back)" />
      <circle cx="28" cy="46" r="1" fill="var(--pike-back)" />
      <circle cx="36" cy="44.5" r="1.2" fill="var(--pike-back)" />
      <circle cx="38.5" cy="48.5" r="0.9" fill="var(--pike-back)" />
    </template>

    <template v-else-if="id === 'postalVote'">
      <circle cx="32" cy="32" r="30" fill="var(--pine)" />
      <!-- A ballot sticking out of the envelope, crossed. -->
      <rect x="22" y="9" width="20" height="24" fill="var(--fg)" stroke="var(--ink)" stroke-width="1.2" />
      <path d="M27 14 L37 24 M37 14 L27 24" stroke="var(--rust)" stroke-width="2.6" stroke-linecap="round" />
      <rect
        x="11"
        y="25"
        width="42"
        height="27"
        rx="2"
        fill="var(--paper-deep)"
        stroke="var(--ink)"
        stroke-width="1.5"
      />
      <path d="M11 52 L28 39 M53 52 L36 39" stroke="var(--ink)" stroke-width="1" opacity="0.45" />
      <path d="M11 25 L32 41 L53 25" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round" />
      <circle cx="32" cy="40" r="5.5" fill="var(--rust)" />
      <circle cx="32" cy="40" r="2.8" fill="none" stroke="var(--rust-deep)" stroke-width="1.2" />
    </template>

    <template v-else-if="id === 'kremowka'">
      <circle cx="32" cy="32" r="30" fill="var(--mist-deep)" />
      <ellipse cx="32" cy="48" rx="23" ry="4.5" fill="var(--fg)" />
      <rect x="13" y="38" width="38" height="7" rx="2" fill="var(--sun)" />
      <rect x="13" y="25" width="38" height="14" fill="var(--cream)" />
      <rect x="13" y="19" width="38" height="7" rx="2" fill="var(--sun)" />
      <circle v-for="x in SUGAR" :key="x" :cx="x" cy="19.5" r="1.3" fill="var(--fg)" />
    </template>

    <template v-else-if="id === 'ringBearer'">
      <circle cx="32" cy="32" r="30" fill="var(--ink)" />
      <circle cx="32" cy="33" r="21" fill="var(--sun)" opacity="0.22" />
      <ellipse cx="32" cy="34" rx="15" ry="12" fill="none" stroke="var(--sun)" stroke-width="6" />
      <path
        d="M20 31 A13 10 0 0 1 36 23"
        fill="none"
        stroke="var(--fg)"
        stroke-width="1.3"
        stroke-linecap="round"
        opacity="0.75"
      />
      <path d="M47 15 L48.2 18.8 L52 20 L48.2 21.2 L47 25 L45.8 21.2 L42 20 L45.8 18.8 Z" fill="var(--fg)" />
    </template>

    <template v-else-if="id === 'forrest'">
      <circle cx="32" cy="32" r="30" fill="var(--paper-deep)" />
      <!-- Life is like a box of chocolates; the white feather drifts in from the opening scene. -->
      <path d="M8 16 Q16 5 26 8 Q18 11 11 17 Z" fill="var(--fg)" stroke="var(--ink-dim)" stroke-width="0.8" />
      <path
        d="M32 54 C13 42 8 31 12 23 C16 15 27 15 32 23 C37 15 48 15 52 23 C56 31 51 42 32 54 Z"
        fill="var(--rust)"
      />
      <path
        d="M32 49 C17 39 14 31 17 25.5 C20 20 28 20.5 32 26.5 C36 20.5 44 20 47 25.5 C50 31 47 39 32 49 Z"
        fill="var(--sun)"
      />
      <circle
        v-for="([x, y], i) in CANDY_CUPS"
        :key="i"
        :cx="x"
        :cy="y"
        r="4.6"
        fill="var(--paper)"
        stroke="var(--paper-line)"
        stroke-width="1.4"
        stroke-dasharray="1.2 0.9"
      />
      <circle cx="24" cy="30" r="3.3" fill="var(--cocoa)" />
      <path
        d="M21.8 29.6 Q24 28 26.2 29.6"
        fill="none"
        stroke="var(--cream)"
        stroke-width="0.9"
        stroke-linecap="round"
      />
      <rect x="29.2" y="29.2" width="5.6" height="5.6" rx="1" fill="var(--cocoa)" />
      <circle cx="40" cy="30" r="3.3" fill="var(--cocoa)" />
      <circle cx="40" cy="30" r="1.2" fill="var(--rust-deep)" />
      <path
        d="M28 41.8 C25 39.6 25.2 36.6 26.8 36.4 C27.6 36.3 28 37 28 37.6 C28 37 28.4 36.3 29.2 36.4 C30.8 36.6 31 39.6 28 41.8 Z"
        fill="var(--cocoa)"
      />
      <circle cx="36" cy="39" r="3.3" fill="var(--cocoa)" />
      <path
        d="M33.8 38.6 Q36 37 38.2 38.6"
        fill="none"
        stroke="var(--cream)"
        stroke-width="0.9"
        stroke-linecap="round"
      />
    </template>

    <template v-else-if="id === 'twardowski'">
      <circle cx="32" cy="32" r="30" fill="var(--ink)" />
      <circle
        v-for="[x, y] in [
          [50, 48],
          [53, 16],
          [44, 9],
          [12, 40],
          [40, 22],
        ]"
        :key="`${x}-${y}`"
        :cx="x"
        :cy="y"
        r="1"
        fill="var(--fg)"
      />
      <!-- A crescent cut out of the full moon by a disc of night sky. -->
      <circle cx="29" cy="42" r="16" fill="var(--cream)" />
      <circle cx="37" cy="35.5" r="13" fill="var(--ink)" />
      <!-- Twardowski's rooster, which carried him to the Moon, standing on its upper horn. -->
      <path d="M18.5 19 C11.5 18 9.5 11 12.5 7 C13 12.5 16 15.5 20 16.5 Z" fill="var(--cocoa)" />
      <path d="M18.5 21 C12 21.5 9.5 16 11 12 C12.5 16.5 15.5 18.5 19.5 18.5 Z" fill="var(--rust-deep)" />
      <path
        d="M17.5 17 C17 12.5 22.5 11.5 25.5 13 C29 15 29 21 25 23.2 C21 25 17 22 17.5 17 Z"
        fill="var(--rust-deep)"
      />
      <path d="M19.5 18 C21.5 16 25 16.6 25.2 19.2 C23 21.2 20.4 20.8 19.5 18 Z" fill="var(--cocoa)" />
      <path d="M25 9 C24.6 12 23.6 14 22.6 15.4 L27.6 15.6 C28.6 13.6 29.6 11.4 30.2 10 Z" fill="var(--rust)" />
      <circle cx="28" cy="9" r="3" fill="var(--rust-deep)" />
      <circle cx="26.4" cy="6.2" r="1.4" fill="var(--comb)" />
      <circle cx="28.2" cy="5.3" r="1.6" fill="var(--comb)" />
      <circle cx="30" cy="6.2" r="1.3" fill="var(--comb)" />
      <polygon points="30.7,8.5 33.6,9.4 30.7,10.3" fill="var(--sun)" />
      <ellipse cx="30.1" cy="11.7" rx="1" ry="1.6" fill="var(--comb)" />
      <circle cx="29" cy="8.4" r="0.65" fill="var(--fg)" />
      <path
        d="M21.6 23.5 L21 27.6 M24.4 23.5 L25 27.6 M19.6 27.8 L22.4 27.8 M23.6 27.8 L26.4 27.8"
        stroke="var(--sun)"
        stroke-width="1.2"
        stroke-linecap="round"
      />
    </template>
  </svg>
</template>

<style scoped>
.trophy-icon {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
