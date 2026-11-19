export interface Config {
  readonly port: number;
  readonly databaseUrl: string;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const databaseUrl = env['DATABASE_URL'];
  if (!databaseUrl) throw new Error('DATABASE_URL is not set (copy .env.example to .env)');
  return { port: Number(env['PORT'] ?? 3000), databaseUrl };
}
