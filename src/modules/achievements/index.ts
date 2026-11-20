// Public API of the achievements module. Other modules and the server import only from here.
export type { AchievementsDependencies } from './application/worldEventsService.js';
export { registerAchievementsHttp, type AchievementsHttpOptions } from './infrastructure/achievementsHttp.js';
export { createSqlSightingRepository } from './infrastructure/sqlSightingRepository.js';
export { createInMemoryAchievements } from './testing/inMemoryAchievements.js';
