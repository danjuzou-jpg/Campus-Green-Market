-- ============================================================
-- 2NH Marketplace — Supabase 数据库建表 SQL
-- ============================================================
-- 使用方法：
--   1. 登录 Supabase Dashboard (https://supabase.com/dashboard)
--   2. 选择你的项目 (zjmtaenvebilatabxwqa)
--   3. 点击左侧 "SQL Editor"
--   4. 新建一个 Query，把下面全部 SQL 粘贴进去
--   5. 点击 "Run" 执行
--   6. 执行完成后，到左侧 "Table Editor" 确认 5 张表已创建
--
-- ⚠️ 注意：如果表已存在，会先删除再重建（DROP IF EXISTS）
--    如果你有重要数据，请先备份！
-- ======================== ====================================

-- ==================== 1. profiles 表 ====================
-- 用户资料表，与 Supabase Auth 的 auth.users 关联
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  school TEXT DEFAULT 'Universiti Malaya (UM)',
  avatar_url TEXT,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 如果触发器已存在则先删除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==================== 2. products 表 ====================
-- 商品信息表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  description TEXT,
  images TEXT[] DEFAULT '{}',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  location_name TEXT,
  location TEXT,  -- 可选的 PostGIS POINT 字符串
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_info JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 按创建时间排序的索引
CREATE INDEX idx_products_created_at ON products(created_at DESC);
-- 按分类查询的索引
CREATE INDEX idx_products_category ON products(category);
-- 按所有者查询的索引
CREATE INDEX idx_products_owner ON products(owner_id);

-- ==================== 3. favorites 表 ====================
-- 收藏关系表
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)  -- 同一用户不能重复收藏
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- ==================== 4. conversations 表 ====================
-- 聊天会话表
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_title TEXT,
  product_image TEXT,
  buyer_name TEXT,
  seller_name TEXT,
  last_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, buyer_id)  -- 同一商品同一买家只能有一个会话
);

CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);

-- ==================== 5. messages 表 ====================
-- 聊天消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at);

-- ==================== 6. RLS 策略 ====================
-- 开启所有表的 Row Level Security

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- profiles: 任何人可读，本人可改
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- products: 任何人可读，登录用户可发布，本人可改/删
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "products_update" ON products FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "products_delete" ON products FOR DELETE USING (auth.uid() = owner_id);

-- favorites: 本人可读写
CREATE POLICY "favorites_select" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- conversations: 参与者可读写
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- messages: 会话参与者可读，发送者可写
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ==================== 7. Realtime 配置 ====================
-- 开启 messages 表的 Realtime，用于聊天实时推送
-- 注意：这需要在 Supabase Dashboard → Database → Replication 中手动开启
-- 或者在 SQL 中执行：
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================
-- 🎉 执行完成！
-- 接下来请检查：
--   1. 左侧 Table Editor 中应该能看到 5 张表
--   2. 到 Storage 页面，创建两个 Bucket：
--      - product-images (公开 Public)
--      - avatars (公开 Public)
--   3. 到 Authentication → Settings → Email 确认邮件认证已开启
-- ============================================================
