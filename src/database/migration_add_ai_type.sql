-- Migration: Add ai_type column to messages table
-- Run this in Supabase SQL Editor if ai_type column doesn't exist

-- Step 1: Add ai_type column (nullable)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS ai_type TEXT;

-- Step 2: Update existing messages
-- Set ai_type based on type column for AI messages
UPDATE messages 
SET ai_type = 'catty' 
WHERE type = 'catty' AND ai_type IS NULL;

UPDATE messages 
SET ai_type = 'futureme' 
WHERE type = 'futureme' AND ai_type IS NULL;

-- User messages should have ai_type = NULL (already NULL by default)

-- Step 3: Drop existing UNIQUE constraint if it exists
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_user_id_message_id_ai_type_key;

-- Step 4: Add CHECK constraint
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_ai_type_check;

ALTER TABLE messages 
ADD CONSTRAINT messages_ai_type_check 
CHECK (ai_type IN ('catty', 'futureme') OR ai_type IS NULL);

-- Step 5: Add new UNIQUE constraint with ai_type
ALTER TABLE messages 
ADD CONSTRAINT messages_user_id_message_id_ai_type_key 
UNIQUE(user_id, message_id, ai_type);

-- Step 6: Create index for better query performance
CREATE INDEX IF NOT EXISTS messages_ai_type_idx ON messages(ai_type);

