/** Six digits: typed by hand from the e-mail when the link can't be opened on the device that plays. */
export const VERIFICATION_CODE_DIGITS = 6;

/**
 * The digits of a code as typed, or null when they aren't exactly six. Spaces, dashes and the like are
 * dropped, so `482-917`, `482 917` and `482917` are one code.
 */
export function normalizeVerificationCode(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  return digits.length === VERIFICATION_CODE_DIGITS ? digits : null;
}

/** How the code is shown in the e-mail: two groups of three, easier to read and retype. */
export function formatVerificationCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}
