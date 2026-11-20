import { describe, expect, it } from 'vitest';
import { readConfig, readMailConfig } from './config';

const DATABASE_URL = 'postgres://localhost/wayfarer';

describe('readConfig', () => {
  it('turns on the dev sign-in with the password "localhost" in a local setup', () => {
    const config = readConfig({ DATABASE_URL, DEV_LOGIN: 'true', SESSION_COOKIE_SECURE: 'false' });

    expect(config.devPassword).toBe('localhost');
  });

  it('leaves the dev sign-in off unless asked for', () => {
    expect(readConfig({ DATABASE_URL, SESSION_COOKIE_SECURE: 'false' }).devPassword).toBeUndefined();
  });

  it.each([
    { setting: 'Secure cookies', env: { DEV_LOGIN: 'true' } },
    {
      setting: 'NODE_ENV=production',
      env: { DEV_LOGIN: 'true', SESSION_COOKIE_SECURE: 'false', NODE_ENV: 'production' },
    },
    { setting: 'TRUST_PROXY=true', env: { DEV_LOGIN: 'true', SESSION_COOKIE_SECURE: 'false', TRUST_PROXY: 'true' } },
  ])('refuses to start with the dev sign-in next to $setting, as in production', ({ env }) => {
    expect(() => readConfig({ DATABASE_URL, ...env })).toThrow('DEV_LOGIN=true is for local development only');
  });

  it('keeps session cookies Secure unless turned off', () => {
    expect(readConfig({ DATABASE_URL }).secureCookies).toBe(true);
  });
});

describe('readMailConfig', () => {
  const MAIL = {
    SMTP_HOST: 'mail23.mydevil.net',
    SMTP_USER: 'noreply@mgrabowski.eu',
    SMTP_PASSWORD: 'secret',
    MAIL_FROM: 'Wayfarer <noreply@mgrabowski.eu>',
  };

  it('returns no mail settings when none are set, as in local development', () => {
    expect(readMailConfig({ DATABASE_URL })).toBeNull();
  });

  it('refuses half-filled mail settings and names what is missing', () => {
    expect(() => readMailConfig({ SMTP_HOST: 'mail23.mydevil.net', SMTP_USER: 'noreply@mgrabowski.eu' })).toThrow(
      'SMTP_PASSWORD, MAIL_FROM not set',
    );
  });

  it('sends over TLS on port 465 unless another port is set', () => {
    expect(readMailConfig(MAIL)?.port).toBe(465);
    expect(readMailConfig({ ...MAIL, SMTP_PORT: '587' })?.port).toBe(587);
  });
});
