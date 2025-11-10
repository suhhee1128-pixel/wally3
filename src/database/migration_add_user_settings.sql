-- Migration: Add user_settings table for storing user preferences
-- Run this in Supabase SQL Editor

-- Step 1: Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  analytics_target DECIMAL(10,2) DEFAULT 5000,
  analytics_period TEXT DEFAULT 'month' CHECK (analytics_period IN ('week', '2weeks', '3weeks', 'month')),
  analytics_start_date TEXT,
  spending_summary_period TEXT DEFAULT 'day' CHECK (spending_summary_period IN ('day', 'week', 'month')),
  ai_enabled JSONB DEFAULT '{"catty": true, "futureme": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Step 4: Create index for better performance
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

