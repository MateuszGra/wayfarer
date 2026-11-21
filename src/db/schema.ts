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
  email_verified_at: Date | null;
  created_at: Generated<Date>;
}

/** The shape of the one-time link tables: `password_resets`, and the base of `email_verifications`. */
export interface OneTimeLinksTable {
  token_hash: string;
  account_id: string;
  expires_at: Date;
  created_at: Generated<Date>;
}

export interface EmailVerificationsTable extends OneTimeLinksTable {
  code_hash: string;
  code_attempts: Generated<number>;
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

export interface WorldSightingsTable {
  account_id: string;
  event: string;
  seen_at: Generated<Date>;
}

export interface NotificationSettingsTable {
  account_id: string;
  step_reminders: Generated<boolean>;
  updated_at: Generated<Date>;
}

export interface SentRemindersTable {
  account_id: string;
  /** `YYYY-MM-DD` in the player's time zone. */
  local_date: string;
  slot: string;
  sent_at: Generated<Date>;
}

export interface Database {
  players: PlayersTable;
  accounts: AccountsTable;
  sessions: SessionsTable;
  email_verifications: EmailVerificationsTable;
  password_resets: OneTimeLinksTable;
  journeys: JourneysTable;
  step_entries: StepEntriesTable;
  world_sightings: WorldSightingsTable;
  notification_settings: NotificationSettingsTable;
  sent_reminders: SentRemindersTable;
}
