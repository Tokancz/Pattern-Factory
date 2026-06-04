-- Migration 004: Achievements.
--
-- Adds a single TEXT[] column to game_saves holding the ids of unlocked
-- achievements. Permanent progression — never cleared by prestige/ascension.
-- Apply this BEFORE deploying the matching server code (the controller reads
-- and writes this column unconditionally), exactly like migration 003.

ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT '{}';
