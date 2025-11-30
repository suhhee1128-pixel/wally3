-- Migration: Add 'calm' to mood check constraint
-- Run this in Supabase SQL Editor

-- First, drop the existing check constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_mood_check;

-- Add new check constraint that includes 'calm'
ALTER TABLE transactions 
ADD CONSTRAINT transactions_mood_check 
CHECK (mood IS NULL OR mood IN ('happy', 'neutral', 'sad', 'calm'));

