import type { EmailError } from '@shared/auth/email';
import type { PasswordError } from '@shared/auth/password';

export type AuthFieldError = EmailError | PasswordError;
