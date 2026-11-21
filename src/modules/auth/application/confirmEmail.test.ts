import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_CODE_ATTEMPTS } from '../domain/emailVerification';
import { VERIFICATION_MS } from '../domain/oneTimeLink';
import { createInMemoryAuth, type InMemoryAuth } from '../testing/inMemoryAuth';
import { confirmEmail, confirmEmailWithCode, currentAccount, login, register, resendVerification } from './authService';

let auth: InMemoryAuth;
beforeEach(() => {
  auth = createInMemoryAuth();
});

const PASSWORD = 'camino2026';
// The fake tokens are numbered: sign-up's confirmation link is token-1, and following it starts session token-2.
const LINK_TOKEN = 'token-1';
const registered = () => register(auth, 'ana@example.com', PASSWORD);
/** A player who signed up and followed the link: confirmed and signed in. */
const signedUp = async () => {
  await registered();
  return confirmEmail(auth, LINK_TOKEN);
};

describe('confirming the e-mail address', () => {
  it('e-mails a confirmation link on sign-up', async () => {
    await registered();

    expect(auth.outbox).toEqual([
      expect.objectContaining({
        to: 'ana@example.com',
        subject: 'Potwierdź adres e-mail w Wayfarerze',
        text: expect.stringContaining(`https://wayfarer.example/verify-email?token=${LINK_TOKEN}`),
      }),
    ]);
  });

  it('puts the code in the same e-mail, in two groups of three', async () => {
    await registered();

    expect(auth.outbox[0]?.text).toContain('Albo wpisz w grze kod: 100-001');
  });

  it('confirms the address from the link and signs the player in', async () => {
    await registered();

    const { token, account } = await confirmEmail(auth, LINK_TOKEN);

    expect(account).toEqual({ email: 'ana@example.com' });
    expect(await currentAccount(auth, token)).toEqual({ email: 'ana@example.com' });
  });

  it('lets the password sign in once the address is confirmed', async () => {
    await registered();
    await confirmEmail(auth, LINK_TOKEN);

    await expect(login(auth, 'ana@example.com', PASSWORD)).resolves.toMatchObject({ account: expect.anything() });
  });

  it('refuses a link used once already', async () => {
    await registered();
    await confirmEmail(auth, LINK_TOKEN);

    await expect(confirmEmail(auth, LINK_TOKEN)).rejects.toMatchObject({ code: 'verification_invalid' });
  });

  it('still takes the link a moment before 48 hours have passed', async () => {
    await registered();
    auth.clock.advance(VERIFICATION_MS - 1);

    await expect(confirmEmail(auth, LINK_TOKEN)).resolves.toMatchObject({ token: expect.any(String) });
  });

  it('refuses the link once 48 hours have passed', async () => {
    await registered();
    auth.clock.advance(VERIFICATION_MS);

    await expect(confirmEmail(auth, LINK_TOKEN)).rejects.toMatchObject({ code: 'verification_invalid' });
  });

  it('refuses a made-up token', async () => {
    await registered();

    await expect(confirmEmail(auth, 'made-up')).rejects.toMatchObject({ code: 'verification_invalid' });
  });

  it('creates the account even when the e-mail could not be sent', async () => {
    auth.mailDown.value = true;
    await registered();

    await expect(registered()).rejects.toMatchObject({ code: 'email_taken' });
  });

  it('sends a new link on request, and the old one stops working', async () => {
    await registered();

    await resendVerification(auth, 'Ana@Example.com');

    expect(auth.outbox).toHaveLength(2);
    await expect(confirmEmail(auth, LINK_TOKEN)).rejects.toMatchObject({ code: 'verification_invalid' });
    await expect(confirmEmail(auth, 'token-2')).resolves.toMatchObject({ token: expect.any(String) });
  });

  it('sends nothing more once the address is confirmed', async () => {
    await signedUp();

    await resendVerification(auth, 'ana@example.com');

    expect(auth.outbox).toHaveLength(1);
  });

  it('answers the same for an address without an account, and sends nothing', async () => {
    await expect(resendVerification(auth, 'nobody@example.com')).resolves.toBeUndefined();

    expect(auth.outbox).toEqual([]);
  });

  it('rejects an invalid address when asked for a new link', async () => {
    await expect(resendVerification(auth, 'ana')).rejects.toMatchObject({ code: 'validation_failed' });
  });
});

describe('confirming the e-mail address with the code', () => {
  // The fake codes count up from 100001, so sign-up's e-mail carries 100-001.
  const CODE = '100-001';
  const tries = async (times: number) => {
    for (let i = 0; i < times; i++) await confirmEmailWithCode(auth, 'ana@example.com', '999-999').catch(() => {});
  };

  it('confirms the address and signs the player in', async () => {
    await registered();

    const { token, account } = await confirmEmailWithCode(auth, 'ana@example.com', CODE);

    expect(account).toEqual({ email: 'ana@example.com' });
    expect(await currentAccount(auth, token)).toEqual({ email: 'ana@example.com' });
  });

  it('takes the code typed without the dash and the address written differently', async () => {
    await registered();

    await expect(confirmEmailWithCode(auth, ' Ana@Example.com', '100001')).resolves.toMatchObject({
      account: { email: 'ana@example.com' },
    });
  });

  it('refuses a wrong code', async () => {
    await registered();

    await expect(confirmEmailWithCode(auth, 'ana@example.com', '999-999')).rejects.toMatchObject({
      code: 'verification_code_invalid',
    });
  });

  it('gives an address without an account the same answer as a wrong code', async () => {
    await registered();

    await expect(confirmEmailWithCode(auth, 'nobody@example.com', CODE)).rejects.toMatchObject({
      code: 'verification_code_invalid',
    });
  });

  it('still takes the right code after four wrong tries', async () => {
    await registered();
    await tries(MAX_CODE_ATTEMPTS - 1);

    await expect(confirmEmailWithCode(auth, 'ana@example.com', CODE)).resolves.toMatchObject({
      account: { email: 'ana@example.com' },
    });
  });

  it('refuses even the right code after five wrong tries', async () => {
    await registered();
    await tries(MAX_CODE_ATTEMPTS);

    await expect(confirmEmailWithCode(auth, 'ana@example.com', CODE)).rejects.toMatchObject({
      code: 'verification_code_invalid',
    });
  });

  it('gives a fresh code five new tries', async () => {
    await registered();
    await tries(MAX_CODE_ATTEMPTS);

    await resendVerification(auth, 'ana@example.com');

    await expect(confirmEmailWithCode(auth, 'ana@example.com', '100-002')).resolves.toMatchObject({
      account: { email: 'ana@example.com' },
    });
  });

  it('stops taking the old code once a new e-mail is sent', async () => {
    await registered();
    await resendVerification(auth, 'ana@example.com');

    await expect(confirmEmailWithCode(auth, 'ana@example.com', CODE)).rejects.toMatchObject({
      code: 'verification_code_invalid',
    });
  });

  it('refuses the code once 48 hours have passed', async () => {
    await registered();
    auth.clock.advance(VERIFICATION_MS);

    await expect(confirmEmailWithCode(auth, 'ana@example.com', CODE)).rejects.toMatchObject({
      code: 'verification_code_invalid',
    });
  });

  it('refuses the code once the link from the same e-mail was used', async () => {
    await registered();
    await confirmEmail(auth, LINK_TOKEN);

    await expect(confirmEmailWithCode(auth, 'ana@example.com', CODE)).rejects.toMatchObject({
      code: 'verification_code_invalid',
    });
  });

  it('rejects a code that is not six digits, without using up a try', async () => {
    await registered();
    await tries(MAX_CODE_ATTEMPTS - 1);

    await expect(confirmEmailWithCode(auth, 'ana@example.com', '12345')).rejects.toMatchObject({
      code: 'validation_failed',
    });
    await expect(confirmEmailWithCode(auth, 'ana@example.com', CODE)).resolves.toBeDefined();
  });
});
