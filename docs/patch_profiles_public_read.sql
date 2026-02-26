-- ================================================================
-- 🔧 补丁：profiles 表公开读取策略
-- 用于支持用户公开主页（/user/:id）
-- 在 Supabase Dashboard → SQL Editor 中运行
-- 日期：2026-02-27
-- ================================================================

-- 删除旧的仅认证用户可读策略
DROP POLICY IF EXISTS "Profiles are viewable by all authenticated users" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- 新策略：所有人（含游客）可以查看 profiles 基本字段
-- 注意：此策略允许 SELECT 整行，敏感字段（如 verification_doc_url、verification_email）
-- 不应通过客户端查询暴露。UserProfile 页面只 select 公开字段。
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

-- ================================================================
-- ✅ 运行完毕后，用户公开主页（/user/:id）即可正常访问。
-- ================================================================
