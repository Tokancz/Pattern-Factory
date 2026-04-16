-- Migration 001: add save_version for optimistic locking
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS save_version INTEGER DEFAULT 0;
