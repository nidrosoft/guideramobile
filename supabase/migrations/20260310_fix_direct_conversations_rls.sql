-- Fix missing RLS on direct_conversations table

ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive legacy policies
DROP POLICY IF EXISTS "direct_conversations_allow_all" ON direct_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON direct_conversations;

-- Users can only see conversations they're part of
CREATE POLICY IF NOT EXISTS direct_conversations_select
  ON direct_conversations FOR SELECT
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- Users can only create conversations involving themselves
CREATE POLICY IF NOT EXISTS direct_conversations_insert
  ON direct_conversations FOR INSERT
  WITH CHECK (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- Users can update conversations they're part of
CREATE POLICY IF NOT EXISTS direct_conversations_update
  ON direct_conversations FOR UPDATE
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- Users can delete conversations they're part of
CREATE POLICY IF NOT EXISTS direct_conversations_delete
  ON direct_conversations FOR DELETE
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());
