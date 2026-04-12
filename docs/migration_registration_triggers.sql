-- ==========================================
-- 2NH Marketplace - 改善新用户注册与验证流程
-- ==========================================

-- 1. 为 profiles 表增加缺失的新生相关字段
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_freshman BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offer_url TEXT;

-- 2. 重写原本的用户注册触发器（插入瞬间）
-- 它将在插入数据时，把所有用户状态强制设为 'unverified'，
-- 并且正确读取前端送来的 school、is_freshman 等数据。
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_school TEXT;
  v_is_freshman BOOLEAN;
  v_offer_url TEXT;
BEGIN
  -- 提取字段，添加安全容错
  v_school := COALESCE(NEW.raw_user_meta_data->>'school', 'Universiti Malaya (UM)');
  
  -- 处理 boolean 的空值转换
  IF NEW.raw_user_meta_data->>'is_freshman' = 'true' THEN
    v_is_freshman := TRUE;
  ELSE
    v_is_freshman := FALSE;
  END IF;

  v_offer_url := NEW.raw_user_meta_data->>'offer_url';

  INSERT INTO public.profiles (
    id, email, full_name, verification_status, school, is_freshman, offer_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'unverified', -- 注册时强制全部保持未验证，等待点击邮件
    v_school,
    v_is_freshman,
    v_offer_url
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定旧的 insert 触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- 3. 添加新的更新监听器（当经过邮箱验证时）
-- 捕捉 email_confirmed_at 从 null 变成有具体时间的事件
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果邮箱这一下刚刚被确认 (表示用户刚才在邮箱里点击了激活链接)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- 本地在校生：判断所有被允许的马来西亚大学后缀
    IF NEW.email LIKE '%.edu.my' 
       OR NEW.email LIKE '%.usm.my'
       OR NEW.email LIKE '%.utm.my'
       OR NEW.email LIKE '%hw.ac.uk'
       OR NEW.email LIKE '%monash.edu' THEN
      UPDATE public.profiles 
      SET verification_status = 'verified' 
      WHERE id = NEW.id;
      
    -- 新生：如果注册时带有 is_freshman 标志，给予 pending（等待人工审核）
    ELSIF NEW.raw_user_meta_data->>'is_freshman' = 'true' THEN
      UPDATE public.profiles 
      SET verification_status = 'pending' 
      WHERE id = NEW.id;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定新的 update 触发器
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- ==========================================
-- 执行完毕！
-- ==========================================
