<script setup lang="ts">
import {
  Map as MapLibreMap,
  setWorkerUrl,
  type GeoJSONSource,
  type LngLatBoundsLike,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { RoutePoint } from '@shared/api/contracts';
import { routeProgress, todaySegment } from '@shared/routes/progress';
import { t } from '@/shared/i18n';

// MapLibre looks for its worker next to its own module. In a production build that module is inlined into
// one of our chunks and the worker file is never copied, so the map stayed blank; `?url` makes Vite emit
// the (self-contained) worker and hands us its address.
setWorkerUrl(mapWorkerUrl);

export interface Props {
  path: readonly RoutePoint[] | null;
  /** Route length and distance walked; with both, the walked part and the traveller's position are drawn. */
  lengthKm?: number;
  doneKm?: number;
  /** The part of `doneKm` today's steps added; drawn apart from the rest of the walked route. */
  todayKm?: number;
  /** Room the overlay panel takes on the right, so the route is framed in the free part of the map. */
  paddingRight?: number;
}

defineOptions({ name: 'RouteMap' });
const props = withDefaults(defineProps<Props>(), { paddingRight: 0, lengthKm: 0, doneKm: 0, todayKm: 0 });

const container = ref<HTMLElement | null>(null);
let map: MapLibreMap | null = null;
// Layers can be added as soon as the style is ready; tiles may still be streaming in.
let styleReady = false;
let resizeObserver: ResizeObserver | null = null;

// WebGL map styles can't read CSS variables, so the design tokens are resolved once at runtime.
const token = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// A flat, paper-and-ink map in the world's palette, on free OpenFreeMap vector tiles (OpenMapTiles schema).
function paperStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': token('--paper') } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': token('--mist') } },
      {
        id: 'forest',
        type: 'fill',
        source: 'omt',
        'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'wood'],
        paint: { 'fill-color': token('--pine'), 'fill-opacity': 0.12 },
      },
      {
        id: 'borders',
        type: 'line',
        source: 'omt',
        'source-layer': 'boundary',
        filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
        paint: { 'line-color': token('--paper-line'), 'line-width': 1.2, 'line-dasharray': [3, 2] },
      },
      {
        id: 'cities',
        type: 'symbol',
        source: 'omt',
        'source-layer': 'place',
        filter: ['==', ['get', 'class'], 'city'],
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 11 },
        paint: { 'text-color': token('--ink-dim'), 'text-halo-color': token('--paper'), 'text-halo-width': 1.5 },
      },
    ],
  };
}

type Line = { type: 'Feature'; properties: object; geometry: { type: 'LineString'; coordinates: number[][] } };
type Points = {
  type: 'FeatureCollection';
  features: { type: 'Feature'; properties: { kind: string }; geometry: { type: 'Point'; coordinates: number[] } }[];
};

const line = (points: readonly RoutePoint[]): Line => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'LineString', coordinates: points.map(([lon, lat]) => [lon, lat]) },
});
const points = (entries: [string, RoutePoint][]): Points => ({
  type: 'FeatureCollection',
  features: entries.map(([kind, [lon, lat]]) => ({
    type: 'Feature',
    properties: { kind },
    geometry: { type: 'Point', coordinates: [lon, lat] },
  })),
});

function setData(id: string, data: Line | Points): void {
  const source = map?.getSource(id) as GeoJSONSource | undefined;
  if (source) source.setData(data);
  else map?.addSource(id, { type: 'geojson', data });
}

function addLayers(): void {
  if (!map || map.getLayer('route-remaining')) return;
  const round = { 'line-cap': 'round', 'line-join': 'round' } as const;
  map.addLayer({
    id: 'route-casing',
    type: 'line',
    source: 'route-all',
    paint: { 'line-color': token('--paper'), 'line-width': 7 },
    layout: round,
  });
  map.addLayer({
    id: 'route-remaining',
    type: 'line',
    source: 'route-remaining',
    paint: { 'line-color': token('--ink-dim'), 'line-width': 2.5, 'line-dasharray': [1.5, 1.5] },
    layout: round,
  });
  map.addLayer({
    id: 'route-walked',
    type: 'line',
    source: 'route-walked',
    paint: { 'line-color': token('--rust'), 'line-width': 4 },
    layout: round,
  });
  // Today's stretch in sunlit gold over the rust of the days before.
  map.addLayer({
    id: 'route-today',
    type: 'line',
    source: 'route-today',
    paint: { 'line-color': token('--sun'), 'line-width': 5 },
    layout: round,
  });
  map.addLayer({
    id: 'route-points',
    type: 'circle',
    source: 'route-points',
    paint: {
      'circle-radius': ['match', ['get', 'kind'], 'position', 8, 5],
      'circle-color': [
        'match',
        ['get', 'kind'],
        'end',
        token('--rust'),
        'position',
        token('--rust-deep'),
        token('--ink'),
      ],
      'circle-stroke-color': token('--paper'),
      'circle-stroke-width': ['match', ['get', 'kind'], 'position', 3, 2],
    },
  });
}

function showRoute(path: readonly RoutePoint[]): void {
  if (!map) return;
  const start = path[0] as RoutePoint;
  const end = path[path.length - 1] as RoutePoint;
  const progress = props.lengthKm > 0 ? routeProgress(path, props.lengthKm, props.doneKm) : null;
  setData('route-all', line(path));
  const before =
    props.lengthKm > 0 ? routeProgress(path, props.lengthKm, Math.max(0, props.doneKm - props.todayKm)) : null;
  setData('route-walked', line(before?.walked ?? [start]));
  setData(
    'route-today',
    line(props.lengthKm > 0 ? todaySegment(path, props.lengthKm, props.doneKm, props.todayKm) : [start]),
  );
  setData('route-remaining', line(progress?.remaining ?? path));
  setData(
    'route-points',
    points([
      ['start', start],
      ['end', end],
      ...(progress && progress.fraction > 0 ? [['position', progress.position] as [string, RoutePoint]] : []),
    ]),
  );
  addLayers();
  fitRoute(path);
}

function fitRoute(path: readonly RoutePoint[]): void {
  if (!map) return;
  const lons = path.map(([lon]) => lon);
  const lats = path.map(([, lat]) => lat);
  const bounds: LngLatBoundsLike = [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
  map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 60, right: 60 + props.paddingRight }, duration: 0 });
}

onMounted(() => {
  if (!container.value) return;
  map = new MapLibreMap({
    container: container.value,
    style: paperStyle(),
    center: [5, 48],
    zoom: 4,
    // One copy of the world, kept around Europe: no repeating the map at its edges, no panning into nowhere.
    renderWorldCopies: false,
    maxBounds: [
      [-32, 26],
      [48, 72],
    ],
  });
  // 'style.load' rather than 'load': 'load' waits for the first tiles, which can take long or never
  // settle on a slow connection, and the route must not wait for the background map.
  // The map often starts inside a container that is still growing (e.g. a dialog opening), so it is
  // resized and the route reframed whenever the container changes size.
  resizeObserver = new ResizeObserver(() => {
    map?.resize();
    if (styleReady && props.path) fitRoute(props.path);
  });
  resizeObserver.observe(container.value);
  map.on('style.load', () => {
    styleReady = true;
    if (props.path) showRoute(props.path);
  });
});
watch(
  () => [props.path, props.doneKm, props.todayKm, props.lengthKm] as const,
  ([path]) => {
    if (path && styleReady) showRoute(path);
  },
);
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  map?.remove();
});
</script>

<template>
  <div ref="container" class="route-map" role="img" :aria-label="t('plan.mapLabel')" />
</template>

<style scoped>
.route-map {
  position: absolute;
  inset: 0;
  background: var(--paper);
}
</style>
