-- Migration: Change message_id from INTEGER to BIGINT
-- Run this in Supabase SQL Editor

-- Step 1: Drop the UNIQUE constraint first (it depends on message_id)
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_user_id_message_id_ai_type_key;

-- Step 2: Change message_id column type from INTEGER to BIGINT
ALTER TABLE messages 
ALTER COLUMN message_id TYPE BIGINT;

-- Step 3: Recreate the UNIQUE constraint
ALTER TABLE messages 
ADD CONSTRAINT messages_user_id_message_id_ai_type_key 
UNIQUE(user_id, message_id, ai_type);

