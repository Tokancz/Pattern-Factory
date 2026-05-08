-- Migration 003: Reality Engine expansion — Ascension / Glyph state.
--
-- Adds Glyph currency, lifetime counters, endgame state and the seen_intro
-- UX flag to game_saves. Creates glyph_upgrade_levels mirroring the
-- existing upgrade_levels schema. Relaxes slot_states.slot_index to
-- allow the 5th thread (slot index 4) unlocked by the Slot V Glyph upgrade.

-- ─── game_saves: new columns ────────────────────────────────────────────
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS glyphs              DOUBLE PRECISION DEFAULT 0;
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS pending_glyphs      DOUBLE PRECISION DEFAULT 0;
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS ascension_count     INTEGER          DEFAULT 0;
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS glyph_pattern_count BIGINT           DEFAULT 0;
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS endgame_state       VARCHAR(20);  -- null | 'stabilized'
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS seen_intro          BOOLEAN          DEFAULT FALSE;

-- ─── glyph_upgrade_levels: new table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS glyph_upgrade_levels (
  id          SERIAL PRIMARY KEY,
  save_id     INTEGER REFERENCES game_saves(id) ON DELETE CASCADE,
  upgrade_id  VARCHAR(100) NOT NULL,
  level       INTEGER DEFAULT 0,
  UNIQUE(save_id, upgrade_id)
);

CREATE INDEX IF NOT EXISTS idx_glyph_upgrade_levels_save ON glyph_upgrade_levels(save_id);

-- ─── slot_states: relax CHECK to allow slot 4 (5th thread) ──────────────
-- Drop and recreate the auto-generated CHECK so existing rows stay valid
-- but new rows can target slot_index 4.
ALTER TABLE slot_states DROP CONSTRAINT IF EXISTS slot_states_slot_index_check;
ALTER TABLE slot_states
  ADD CONSTRAINT slot_states_slot_index_check
  CHECK (slot_index >= 0 AND slot_index <= 4);
