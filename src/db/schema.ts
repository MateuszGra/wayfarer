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

export interface JourneysTable {
  id: string;
  account_id: string;
  route_id: string;
  daily_steps: number;
  time_zone: string;
  /** `YYYY-MM-DD`: dates are read as plain strings (see database.ts). */
  started_on: string | null;
  route_since_km: Generated<number>;
  created_at: Generated<Date>;
}

export interface StepEntriesTable {
  journey_id: string;
  steps_date: string;
  steps: number;
  entered_at_hour: number;
  entered_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Database {
  players: PlayersTable;
  accounts: AccountsTable;
  sessions: SessionsTable;
  journeys: JourneysTable;
  step_entries: StepEntriesTable;
}
