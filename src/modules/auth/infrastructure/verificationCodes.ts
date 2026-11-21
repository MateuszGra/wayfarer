import { randomInt } from 'node:crypto';
import { VERIFICATION_CODE_DIGITS } from '../../../shared/auth/verificationCode.js';
import type { VerificationCodes } from '../domain/ports.js';

export const verificationCodes: VerificationCodes = {
  issue: () => String(randomInt(10 ** VERIFICATION_CODE_DIGITS)).padStart(VERIFICATION_CODE_DIGITS, '0'),
};
