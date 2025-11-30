-- Migration: Add 'advisor' support to messages table
-- Run this in Supabase SQL Editor to allow advisor messages to be saved

-- Step 1: Drop existing CHECK constraints
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_type_check;

ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_ai_type_check;

-- Step 2: Add updated type CHECK constraint with 'advisor'
ALTER TABLE messages 
ADD CONSTRAINT messages_type_check 
CHECK (type IN ('user', 'catty', 'futureme', 'advisor'));

-- Step 3: Add updated ai_type CHECK constraint with 'advisor'
ALTER TABLE messages 
ADD CONSTRAINT messages_ai_type_check 
CHECK (ai_type IN ('catty', 'futureme', 'advisor') OR ai_type IS NULL);

-- Step 4: Verify the constraints
-- You can check by running:
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name LIKE 'messages%check';

-- IMPORTANT: After running this migration, advisor messages should save properly!

