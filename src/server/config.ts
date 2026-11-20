export interface Config {
  readonly port: number;
  readonly databaseUrl: string;
  /** Session cookies are Secure unless turned off for local development over plain http. */
  readonly secureCookies: boolean;
  readonly trustProxy: boolean;
  /** The password that signs in with any address in local development, or undefined when off. */
  readonly devPassword: string | undefined;
}

// The dev sign-in password; spelled out so it is obvious in .env and in code review.
export const DEV_PASSWORD = 'localhost';

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const databaseUrl = env['DATABASE_URL'];
  if (!databaseUrl) throw new Error('DATABASE_URL is not set (copy .env.example to .env)');
  const secureCookies = env['SESSION_COOKIE_SECURE'] !== 'false';
  const trustProxy = env['TRUST_PROXY'] === 'true';
  const devLogin = env['DEV_LOGIN'] === 'true';
  // Any sign of a real deployment (Passenger sets NODE_ENV=production; production has Secure cookies and
  // sits behind a proxy) means the dev sign-in leaked into it, e.g. from a copied .env: refuse to start.
  if (devLogin && (env['NODE_ENV'] === 'production' || secureCookies || trustProxy)) {
    throw new Error(
      'DEV_LOGIN=true is for local development only (needs SESSION_COOKIE_SECURE=false, no TRUST_PROXY, no NODE_ENV=production)',
    );
  }
  return {
    port: Number(env['PORT'] ?? 3000),
    databaseUrl,
    secureCookies,
    trustProxy,
    devPassword: devLogin ? DEV_PASSWORD : undefined,
  };
}
