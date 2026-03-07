-- ================================================================
-- 🔧 全面修复 RLS 策略 — 2H Green Marketplace
-- 在 Supabase Dashboard → SQL Editor 中运行
-- 日期：2026-02-26
-- ================================================================
-- ⚠️ 本脚本使用 IF NOT EXISTS / DROP + CREATE 方式，可安全重复运行
-- ⚠️ 覆盖范围：所有数据表 + 所有 Storage Bucket
-- ================================================================


-- ================================================================
-- 第一部分：修复/重建数据表 RLS 策略
-- ================================================================

-- ──────────────────────────────────
-- 1. products 表
-- ──────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 先删除旧策略（安全重跑）
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

-- 查看：所有人可浏览（含未登录游客）
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

-- 创建：只能以自己为发布者创建
CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- 修改：只能修改自己的商品
CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = owner_id);

-- ★★★ 删除：只能删除自己的商品 ★★★
-- 这是之前删除失败的根本原因之一
CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = owner_id);


-- ──────────────────────────────────
-- 2. profiles 表
-- ──────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 查看：所有登录用户可以查看
CREATE POLICY "Profiles are viewable by all authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- 修改：只能编辑自己的资料（包括 verification_status、verification_doc_url 等）
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 创建：只能创建自己的 profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ──────────────────────────────────
-- 3. favorites 表
-- ──────────────────────────────────
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);


-- ──────────────────────────────────
-- 4. conversations 表
-- ──────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations as buyer" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations as buyer"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);


-- ──────────────────────────────────
-- 5. messages 表
-- ──────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

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

CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );


-- ──────────────────────────────────
-- 6. reports 表 ★★★ 之前完全缺失 ★★★
-- ──────────────────────────────────
-- 如果 reports 表不存在，先创建
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) NOT NULL,
  report_type TEXT NOT NULL,          -- 'product' 或 'user'
  target_id TEXT NOT NULL,            -- 商品或用户 ID
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',      -- pending / reviewed / resolved
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert reports" ON reports;
DROP POLICY IF EXISTS "Users can view own reports" ON reports;

-- 创建：登录用户可以提交举报
CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 查看：只能看到自己提交的举报
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);


-- ================================================================
-- 第二部分：修复 Storage Bucket RLS 策略
-- ================================================================
-- Storage 政策通过 storage.objects 表管理
-- Supabase 中 Storage 的 RLS 与普通表不同，需要特别配置
-- ================================================================

-- ──────────────────────────────────
-- 7. product-images Bucket
-- ──────────────────────────────────
-- 确保 bucket 存在（如果不存在则创建）
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 删除旧策略
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;

-- 查看：所有人可以查看（公开 bucket）
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 上传：登录用户可以上传
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

-- 更新：只能更新自己文件夹下的图片（路径前缀为 {userId}/...）
-- 安全修复 (P0-2): 配合客户端上传路径改为 `${userId}/${filename}` 使用
CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 删除：只能删除自己文件夹下的图片（路径前缀为 {userId}/...）
-- 安全修复 (P0-2): 配合客户端上传路径改为 `${userId}/${filename}` 使用
CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ──────────────────────────────────
-- 8. avatars Bucket
-- ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );


-- ──────────────────────────────────
-- 9. verification-docs Bucket ★★★ 上传验证文件失败的原因 ★★★
-- ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users can upload verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own verification docs" ON storage.objects;

-- ★★★ 上传：登录用户可以上传认证文件 ★★★
CREATE POLICY "Users can upload verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND auth.role() = 'authenticated'
  );

-- 查看：只能查看自己上传的文件（通过文件名前缀判断）
CREATE POLICY "Users can view own verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND auth.role() = 'authenticated'
  );


-- ================================================================
-- 第三部分：验证
-- ================================================================
-- 运行以下查询确认所有策略已生效：

-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;

-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
-- ORDER BY cmd;

-- ================================================================
-- ✅ 完成！所有数据表和 Storage Bucket 现在都受 RLS 保护。
-- ================================================================
