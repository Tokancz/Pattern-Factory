CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  factory_name  VARCHAR(50) NOT NULL,
  verified      BOOLEAN DEFAULT FALSE,
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  last_login    TIMESTAMP DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game saves (one per user)
CREATE TABLE game_saves (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  money          DOUBLE PRECISION DEFAULT 0,
  dc             DOUBLE PRECISION DEFAULT 0,
  prestige_points DOUBLE PRECISION DEFAULT 0,
  pending_prestige_points DOUBLE PRECISION DEFAULT 0,
  level          INTEGER DEFAULT 1,
  exp            DOUBLE PRECISION DEFAULT 0,
  unlocked_slots INTEGER DEFAULT 1,
  last_played    BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  save_version   INTEGER DEFAULT 0
);

-- Slot states (4 per save)
CREATE TABLE slot_states (
  id               SERIAL PRIMARY KEY,
  save_id          INTEGER REFERENCES game_saves(id) ON DELETE CASCADE,
  slot_index       INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 3),
  pattern_id       VARCHAR(50),
  progress         DOUBLE PRECISION DEFAULT 0,
  unlocked         BOOLEAN DEFAULT FALSE,
  speed_multiplier DOUBLE PRECISION DEFAULT 1,
  output_multiplier DOUBLE PRECISION DEFAULT 1,
  UNIQUE(save_id, slot_index)
);

-- Upgrade levels
CREATE TABLE upgrade_levels (
  id           SERIAL PRIMARY KEY,
  save_id      INTEGER REFERENCES game_saves(id) ON DELETE CASCADE,
  upgrade_id   VARCHAR(100) NOT NULL,
  level        INTEGER DEFAULT 0,
  upgrade_type VARCHAR(20) CHECK (upgrade_type IN ('normal', 'dc', 'prestige')),
  UNIQUE(save_id, upgrade_id)
);

-- Machine levels
CREATE TABLE machine_levels (
  id         SERIAL PRIMARY KEY,
  save_id    INTEGER REFERENCES game_saves(id) ON DELETE CASCADE,
  machine_id VARCHAR(100) NOT NULL,
  level      INTEGER DEFAULT 0,
  UNIQUE(save_id, machine_id)
);

-- Pattern progress
CREATE TABLE pattern_progress (
  id         SERIAL PRIMARY KEY,
  save_id    INTEGER REFERENCES game_saves(id) ON DELETE CASCADE,
  pattern_id VARCHAR(50) NOT NULL,
  level      INTEGER DEFAULT 1,
  exp        DOUBLE PRECISION DEFAULT 0,
  unlocked   BOOLEAN DEFAULT FALSE,
  UNIQUE(save_id, pattern_id)
);

-- Leaderboard
CREATE TABLE leaderboard_entries (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  factory_name    VARCHAR(50) NOT NULL,
  prestige_points DOUBLE PRECISION DEFAULT 0,
  money           DOUBLE PRECISION DEFAULT 0,
  level           INTEGER DEFAULT 1,
  submitted_at    TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_user_leaderboard UNIQUE (user_id)
);

-- Indexes for common queries
CREATE INDEX idx_leaderboard_prestige ON leaderboard_entries(prestige_points DESC);
CREATE INDEX idx_leaderboard_user     ON leaderboard_entries(user_id);
CREATE INDEX idx_slot_states_save     ON slot_states(save_id);
CREATE INDEX idx_upgrade_levels_save  ON upgrade_levels(save_id);