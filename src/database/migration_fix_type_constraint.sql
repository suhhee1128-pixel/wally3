-- Migration: Update messages.type CHECK constraint to include 'futureme'
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_type_check;

-- Step 2: Add the updated CHECK constraint with 'futureme' included
ALTER TABLE messages 
ADD CONSTRAINT messages_type_check 
CHECK (type IN ('user', 'catty', 'futureme'));

