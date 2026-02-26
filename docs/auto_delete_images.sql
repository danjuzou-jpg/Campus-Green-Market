-- ================================================================
-- Solution for Orphaned Images in Supabase Storage
-- This creates a Postgres Function & Trigger that automatically
-- deletes images from the `product-images` bucket when a product
-- is deleted from the `products` table.
-- ================================================================

-- 1. Create the function that extracts filename from URL and deletes from storage
CREATE OR REPLACE FUNCTION delete_product_images()
RETURNS TRIGGER AS $$
DECLARE
  img_url TEXT;
  file_name TEXT;
BEGIN
  -- Check if the deleted product had images
  IF OLD.images IS NOT NULL THEN
    FOREACH img_url IN ARRAY OLD.images
    LOOP
      -- Extract just the filename from the URL 
      -- e.g. https://.../product-images/17123456789_abc.jpg -> 17123456789_abc.jpg
      file_name := substring(img_url from '[^/]+$');
      
      -- Delete the corresponding object from storage.objects
      -- Supabase Storage will automatically clean up the underlying S3 file
      DELETE FROM storage.objects
      WHERE bucket_id = 'product-images' AND name = file_name;
    END LOOP;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger to fire ON DELETE
DROP TRIGGER IF EXISTS tr_delete_product_images ON products;

CREATE TRIGGER tr_delete_product_images
AFTER DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION delete_product_images();

-- ================================================================
-- Done! Whenever a product is deleted, its images will now be
-- automatically purged from your Storage bucket, saving space.
-- ================================================================
