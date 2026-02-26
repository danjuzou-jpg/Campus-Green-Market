-- ================================================================
-- 修复：移除阻塞商品删除的 Storage 清理触发器
-- 在 Supabase Dashboard → SQL Editor 中运行
-- ================================================================
-- 原因：Supabase 不允许通过 SQL trigger 直接操作 storage.objects 表
-- 错误信息："Direct deletion from storage tables is not allowed. 
--           Use the Storage API instead."
-- 解决方案：移除触发器，图片清理改由前端代码通过 Storage API 完成
-- ================================================================

-- 第一步：查看 products 表上的所有触发器
SELECT tgname AS trigger_name, 
       pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'products'::regclass
AND NOT tgisinternal;

-- 第二步：删除清理图片的触发器和函数
-- （名字可能是以下几种，全部尝试删除，不存在的会自动跳过）
DROP TRIGGER IF EXISTS delete_product_images ON products;
DROP TRIGGER IF EXISTS cleanup_product_images ON products;
DROP TRIGGER IF EXISTS auto_delete_product_images ON products;
DROP TRIGGER IF EXISTS trigger_delete_product_images ON products;
DROP TRIGGER IF EXISTS on_product_delete_cleanup ON products;

-- 删除关联的函数
DROP FUNCTION IF EXISTS delete_product_images() CASCADE;
DROP FUNCTION IF EXISTS cleanup_product_images() CASCADE;
DROP FUNCTION IF EXISTS auto_delete_product_images() CASCADE;
DROP FUNCTION IF EXISTS handle_product_image_cleanup() CASCADE;

-- ================================================================
-- ✅ 完成后重新测试删除商品
-- 图片清理现在由前端代码通过 supabase.storage API 完成
-- ================================================================
