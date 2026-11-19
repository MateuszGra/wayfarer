import type { Generated } from 'kysely';

export interface PlayersTable {
  id: string;
  created_at: Generated<Date>;
}

export interface Database {
  players: PlayersTable;
}
