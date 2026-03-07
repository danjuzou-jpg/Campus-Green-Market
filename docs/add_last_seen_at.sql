-- 为 profiles 表添加 last_seen_at 字段
-- 用于「上次活跃时间」功能
-- 在 Supabase SQL Editor 中运行此脚本

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- 将现有用户的 last_seen_at 初始化为 updated_at（如有）或当前时间
UPDATE profiles
  SET last_seen_at = COALESCE(updated_at, NOW())
  WHERE last_seen_at IS NULL;

-- RLS 说明：profiles 表的现有更新策略已允许用户更新自己的行，
-- last_seen_at 字段会随之自动受保护，无需额外策略。
