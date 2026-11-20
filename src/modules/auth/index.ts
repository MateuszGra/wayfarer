// Public API of the auth module. Other modules and the server import only from here.
export type { AuthDependencies, Authenticated } from './application/authService.js';
export type { AccountId } from './domain/account.js';
export { AuthError } from './domain/errors.js';
export { AttemptLimiter } from './infrastructure/attemptLimiter.js';
export { createScryptHasher } from './infrastructure/scryptHasher.js';
export { createPwnedPasswords } from './infrastructure/pwnedPasswords.js';
export { createSqlAccountRepository, createSqlSessionRepository } from './infrastructure/sqlRepositories.js';
export { sessionTokens } from './infrastructure/sessionTokens.js';
export { uuidv7 } from './infrastructure/uuidv7.js';
export { registerAuthHttp, requireSession, type AuthHttpOptions } from './infrastructure/authHttp.js';
export { createInMemoryAuth, FakeClock, type InMemoryAuth } from './testing/inMemoryAuth.js';
