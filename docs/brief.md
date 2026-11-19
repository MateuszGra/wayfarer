# Wayfarer — Project Brief

> Working title. A slow, calm walking game powered by the player's real-world steps.

## 1. Concept

Wayfarer is a cozy, unhurried game in which a small traveller walks a real long-distance route — for example from Poland to Santiago de Compostela — at the pace of the player's own real-life steps. Steps come from a fitness tracker (Garmin, a smart band) or from the phone's health data. The game has no rush and no fail state: it is about the journey, the changing landscape and the quiet satisfaction of seeing how far you have walked.

Genre references: cozy / idle / companion games (walk-to-progress, "slow games"). The feeling we want is a window onto a beautiful, real place you are slowly travelling through.

## 2. Core pillars

The game stands on two things. Every feature is judged by how much it strengthens them; anything that competes with them for attention is cut.

### Pillar 1 — Beautiful views

The scenery is the product. Opening the game should feel like looking out of a window onto a real, breathtaking place.

- Most of the screen is landscape; the UI stays minimal and can be hidden completely.
- Views match the kind of place the traveller is in: high mountains, forest, lakeshore, farmland, a village. They are a believable impression of the region, not an exact reproduction.
- Light carries the mood: sunrise, golden hour, blue hour, night sky, fog, rain, snow.
- Views keep changing as the traveller moves, so walking more always shows something new.
- A photo mode, so players can save and share the view where their traveller is right now.

### Pillar 2 — Visible progress

The player must always feel how far they have come, and that their real steps did it.

- A route map that shows the whole journey, the part already walked and the current position.
- Clear numbers: kilometres walked, kilometres left, days on the road, steps today.
- Milestones tied to real places: crossing a border, reaching a pass, arriving in a town.
- Postcards / journal entries for every notable place reached, building a visual record of the journey.
- A view of the journey so far: looking back at the places already passed.
- Arriving at the destination is a real moment, a reward for weeks or months of walking.

## 3. Platforms

- Web app in the mobile browser on Android and iOS (installable as a PWA).
- Desktop browser is a secondary target (viewing progress, choosing routes).
- Native apps are out of scope for the first version, but may be needed later for direct access to Apple Health / Health Connect (see section 7).

## 4. Core loop

1. The player picks a route on a real map (a famous trail or a custom A→B path).
2. Throughout the day the player walks in real life; their tracker records steps.
3. The game syncs the steps and converts them into distance along the route.
4. The traveller advances along the route; the scenery switches to the biome that matches the area the route crosses.
5. The player opens the game to watch the traveller, see where they are, and enjoy the view.

The traveller only moves when the player has walked. Real steps are the only currency of progress.

### Screens

The game is something you watch, not a world you explore. There is no free camera and no player-controlled movement.

- **Scene view (main screen):** a fixed, composed view, like a living painting or diorama. The traveller walks along a path through the landscape while it slowly scrolls past, or rests at camp by the fire. The landscape is built in layers: distant mountain ridges, a middle ground (forest, meadow, lake, village) and a foreground (path, traveller, camp).
- **Map view (separate screen):** the real map of the whole route with the part already walked, the current position, milestones and distance stats.

## 5. Day and night

The game follows the player's local time of day:

- **Day** — the traveller walks for as long as yesterday's steps allow (see "Daily step budget"), then rests at camp.
- **Evening** — the traveller sets up camp and lights the fire.
- **Night** — the traveller sleeps by the campfire under the stars; the camp spot fits the terrain (a rock ledge in the mountains, a lakeshore, a forest clearing, a hostel/albergue in a village).
- **Morning** — the camp is packed and, if there is a step budget, the walk continues.

### Daily step budget

The traveller walks on **yesterday's** steps. This gives the game a calm daily rhythm and means today's walk is already decided when the player opens the game.

1. **First sync imports yesterday.** Right after the account is created and a step source is connected, the first sync fetches **yesterday's** steps. They become the budget for the very first day, so the traveller sets off on the day the player joins instead of waiting until tomorrow. Older history is not imported: the journey starts now.
2. **Sync after midnight.** From then on, shortly after midnight (player's local time) the server fetches the previous day's steps from the connected tracker and stores them as today's step budget.
3. **The walk starts at 06:00.** If the budget is above zero, the traveller packs up and sets off at 06:00.
4. **Steps set how long the walk lasts.** The budget is turned into walking time, not literally into seconds of animation. Reference point: **10,000 steps = walking until 20:00**. Fewer steps mean an earlier stop. The walk never goes past sunset; extra steps beyond the cap make the traveller cover more distance in the same time.
5. **Distance comes from steps.** The distance gained on the route is calculated from the steps (stride length); the walking time only spreads that distance across the day. When the walk ends the traveller has covered exactly the distance earned.
6. **When the budget runs out during the day,** the traveller makes camp and rests until morning. The fire is lit only in the evening.
7. **No steps means a rest day.** With a budget of zero the traveller stays at camp all day: no fire during the day, the fire is lit in the evening as usual. No penalty, no guilt; it is simply a day off.

Open questions for these rules:

- The exact curve from steps to walking time: linear up to the cap, or a curve that gives small step counts a noticeably longer walk (for example the square root)?
- Whether today's steps so far are shown as a preview ("tomorrow you will walk until about 15:30").
- How a late sync is handled, for example when the tracker uploads steps hours after midnight: the walk starts late, or it catches up by walking faster?

Lighting, sky, weather and ambient sound change across the day.

### Weather follows the player

The weather in the game mirrors the real weather **where the player is**, not on the route. If it rains outside the player's window, the traveller walks in the rain. It ties the game to the player's own day.

- **Location:** an approximate region (city level) from the player's IP address. The lookup runs on our server against a local GeoLite2 database, so no IP address is sent to a third party.
- **Weather data:** a free forecast API (Open-Meteo, no key needed). It is fetched per region and cached for about an hour, not per player.
- **Mapping:** the current conditions map to the game's weather states: clear, overcast, rain, storm, snow, fog and wind. Temperature can tune details such as breath puffs in the cold.
- **Fallbacks:**
  - Mobile networks and VPNs often geolocate far from the real place, so the player can set a city by hand in settings.
  - When nothing is known, the game uses seeded seasonal weather.
- **Privacy:** only the region is stored, never the IP address or a precise location.

## 6. Routes and biomes

### Routes

- Ready-made famous routes, e.g.:
  - Camino de Santiago (several variants: Camino Francés, Camino Portugués, and a long route starting in Poland)
  - Via Francigena
  - Tatra / Carpathian ridge trails
  - West Highland Way, Tour du Mont Blanc, Kungsleden, Pacific Crest Trail
- A custom route between two real places, snapped to real paths and roads.
- Route geometry from real map data (e.g. OpenStreetMap hiking relations, GPX files).

### Biomes

Each stretch of the route is tagged with the biome closest to the real area (derived from land-cover and elevation data, or set by hand). The scene is then composed from that biome's asset set, with seeded variation so it does not repeat. Real data decides _which_ biome, not the exact shape of the landscape:

- High mountains, ridges, rock ledges, passes
- Forests (beech, pine, mixed), meadows
- Lakes, rivers, coastlines
- Farmland, vineyards, small villages, historic towns, churches and monasteries along the way

The goal is a believable impression of the region (mountains look like mountains of that kind, forests like the forests there), not an exact reproduction of the real view. An exact reproduction would need a unique image for every point of the route. A limited set of biomes with variation keeps the art workload finite.

## 7. Step data sources

Getting steps reliably is the main technical risk of a browser-only game.

| Source                | Access from a web app                                                  | Notes                                                           |
| --------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| Garmin                | Garmin Connect Developer Program (Health API, OAuth, server-to-server) | Requires approval as a Garmin developer; needs a backend        |
| Fitbit                | Fitbit Web API (OAuth)                                                 | Works from a backend                                            |
| Strava                | Strava API (OAuth)                                                     | Activities, not total daily steps                               |
| Apple Health          | No web API                                                             | Needs a native iOS app or a companion app                       |
| Google Health Connect | No web API                                                             | Needs a native Android app                                      |
| Manual entry          | Always available                                                       | Fallback; easy to cheat, but the game is single-player and cozy |

Initial direction: a web app with a small backend that connects to tracker cloud APIs via OAuth (Garmin first), plus manual entry. A thin native companion app for Apple Health / Health Connect can come later.

## 8. Art direction and mood

The binding visual rules (palette, shading, biomes, the wanderer, animation) live in [style-guide.md](style-guide.md).

- Calm, painterly or stylised 2D/2.5D scenes with layered parallax landscapes.
- Strong emphasis on light: golden hour, blue hour, starry nights, fog in valleys.
- Small, expressive traveller with simple gear (backpack, staff, tent).
- Soft ambient soundscape: wind, birds, streams, crackling fire.
- Minimal UI; the scenery is the main screen.

## 9. Progression and features (ideas, not committed)

- Route map showing distance walked, distance left and the current location.
- Journal / postcards: notable places reached are saved as postcards with a short real-world description.
- Pilgrim's passport with stamps for towns along the Camino.
- Daily and lifetime statistics (steps, km, days on the road).
- Gentle milestones; no streak punishment, no pressure.
- Possibly: walking a route together with friends.

## 10. Non-goals

- No combat, no fail state, no time pressure.
- No pay-to-walk (no buying distance).
- Not a fitness coaching app.
- Not a recreation of any existing game.

## 11. Open questions

- Exact art style of the layered 2.5D scenes (painterly, flat vector, pixel art)?
- How many biomes for the first route, and how many regional variants per biome (e.g. alpine vs. Pyrenean mountains, Galician vs. Polish forest)?
- Do major landmarks (e.g. the cathedral in Santiago) get their own hand-made scene at milestones?
- Steps-to-distance conversion: fixed stride length, or based on the player's height / tracker distance?
- Does the traveller "spend" steps in real time, or catch up instantly when the game is opened?
- How to get Apple Health data without a native iOS app?
- Tech stack for the frontend and backend.

## 12. First milestone (proposal)

A playable prototype in the mobile browser:

- One route (e.g. the final 100 km of the Camino Francés, Sarria → Santiago).
- Manual step entry.
- A traveller walking across 2–3 biome scenes with a day/night cycle and a night camp.
- A simple route map with progress.
