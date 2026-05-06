-- Migration 002: pending PP accumulated by Cross during a run, converted to real PP on prestige
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS pending_prestige_points DOUBLE PRECISION DEFAULT 0;
