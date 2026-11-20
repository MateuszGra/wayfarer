import type { Generated } from 'kysely';

export interface PlayersTable {
  id: string;
  created_at: Generated<Date>;
}

export interface AccountsTable {
  id: string;
  email: string;
  password_hash: string;
  failed_logins: Generated<number>;
  locked_until: Date | null;
  created_at: Generated<Date>;
}

export interface SessionsTable {
  token_hash: string;
  account_id: string;
  expires_at: Date;
  created_at: Generated<Date>;
}

export interface Database {
  players: PlayersTable;
  accounts: AccountsTable;
  sessions: SessionsTable;
}
