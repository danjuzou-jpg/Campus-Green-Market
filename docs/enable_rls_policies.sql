-- ================================================================
-- Row Level Security (RLS) Policies for 2H Marketplace
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. conversations 表 — 只有买家和卖家可以查看/修改自己的会话
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 查看：只能看到自己参与的会话
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 创建：只能以自己为买家创建
CREATE POLICY "Users can create conversations as buyer"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- 修改：只能修改自己参与的会话（标记已读等）
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 删除：只能删除自己参与的会话
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ================================================================

-- 2. messages 表 — 只有会话参与者可以查看/发送消息
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 查看：只能查看自己所参与会话中的消息
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- 发送：只能在自己参与的会话中发送消息，且必须以自己的身份发送
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- 删除：只能删除自己参与的会话中的消息
CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ================================================================

-- 3. profiles 表 — 只能查看和编辑自己的资料
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 查看：所有登录用户可以查看所有 profile（公开信息）
CREATE POLICY "Profiles are viewable by all authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- 修改：只能编辑自己的资料
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 创建：只能创建自己的 profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ================================================================

-- 4. favorites 表 — 收藏只对自己可见
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- Done! Your database is now protected by Row Level Security.
-- ================================================================
