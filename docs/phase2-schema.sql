-- ============================================================
-- 2NH Marketplace — 阶段 2 补充 SQL
-- ============================================================
-- 使用方法：同阶段 1，在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 1. profiles 表：新增认证相关字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_doc_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_email TEXT;

-- 2. conversations 表：新增已读时间字段（用于未读消息计数）
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS buyer_last_read_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS seller_last_read_at TIMESTAMPTZ DEFAULT NOW();

-- 3. 确保 verification-docs bucket 的 Storage 策略
-- 请在 Supabase Dashboard → Storage 中手动创建 bucket：
--   名称：verification-docs
--   类型：Private（仅管理员可见）

-- ============================================================
-- 🎉 执行完成！之后请手动创建 Storage Bucket：verification-docs (Private)
-- ============================================================
