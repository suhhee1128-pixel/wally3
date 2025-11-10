-- Migration: Add notes column to transactions table
-- Run this in Supabase SQL Editor

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS notes TEXT;

