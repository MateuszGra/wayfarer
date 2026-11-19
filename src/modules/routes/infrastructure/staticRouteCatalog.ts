import { createRoute, routeId, type RouteCatalog, type RoutePoint } from '../domain/route.js';

// Routes are prepared offline by the route builder; until it exists, the catalogue is fixed data.
// The path is a coarse line through the main towns (Via Regia, then the Via Podiensis and the Camino Francés),
// enough to draw the route on the map; the builder will replace it with the real walking line.
const BALTIC_SANTIAGO_PATH: RoutePoint[] = [
  [18.6466, 54.352], // Gdańsk
  [18.598, 53.0138], // Toruń
  [17.6, 52.535], // Gniezno
  [16.9252, 52.4064], // Poznań
  [15.506, 51.935], // Zielona Góra
  [14.987, 51.153], // Zgorzelec / Görlitz
  [13.7373, 51.0504], // Dresden
  [12.3731, 51.3397], // Leipzig
  [11.0299, 50.9848], // Erfurt
  [9.6755, 50.5558], // Fulda
  [8.6821, 50.1109], // Frankfurt
  [8.2473, 49.9929], // Mainz
  [6.1757, 49.1193], // Metz
  [5.3335, 47.8628], // Langres
  [3.7477, 47.4664], // Vézelay
  [3.8853, 45.0434], // Le Puy-en-Velay
  [2.3986, 44.5992], // Conques
  [1.4407, 44.4475], // Cahors
  [1.0853, 44.1043], // Moissac
  [-1.2366, 43.1633], // Saint-Jean-Pied-de-Port
  [-1.6432, 42.8125], // Pamplona
  [-2.4456, 42.4627], // Logroño
  [-3.6969, 42.3439], // Burgos
  [-5.5671, 42.5987], // León
  [-6.5961, 42.5464], // Ponferrada
  [-8.5446, 42.8782], // Santiago de Compostela
];

const ROUTES = [createRoute(routeId('baltic-santiago'), 3200, BALTIC_SANTIAGO_PATH)];

export function createStaticRouteCatalog(): RouteCatalog {
  return { all: async () => ROUTES };
}
