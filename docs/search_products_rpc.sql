-- ==============================================================================
-- 2NH Marketplace - Advanced Search & Pagination RPC Function
-- Supports: Text Search, Category Filter, Distance Filtering, Pagination
-- ==============================================================================

-- Enable PostGIS if not already enabled (needed for distance calculation)
CREATE EXTENSION IF NOT EXISTS postgis;

DROP FUNCTION IF EXISTS search_products(text, text, text, float, float, float, int, int);

CREATE OR REPLACE FUNCTION search_products(
    search_term TEXT DEFAULT '',
    category_filter TEXT DEFAULT 'All',
    location_filter TEXT DEFAULT 'All Locations',
    user_lat FLOAT DEFAULT NULL,
    user_lng FLOAT DEFAULT NULL,
    max_distance_km FLOAT DEFAULT NULL,
    page_limit INT DEFAULT 20,
    page_offset INT DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title TEXT,
    price NUMERIC,
    currency TEXT,
    description TEXT,
    images TEXT[],
    category TEXT,
    tags TEXT[],
    location_name TEXT,
    lat FLOAT,
    lng FLOAT,
    owner_id UUID,
    contact_info JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    distance_km FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.price,
        p.currency,
        p.description,
        p.images,
        p.category,
        p.tags,
        p.location_name,
        p.lat,
        p.lng,
        p.owner_id,
        p.contact_info,
        p.created_at,
        p.updated_at,
        -- Calculate distance if user lat/lng provided, else 0
        CASE 
            WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND p.lat IS NOT NULL AND p.lng IS NOT NULL THEN
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
                    ST_SetSRID(ST_MakePoint(p.lng, p.lat), 4326)::geography
                ) / 1000.0 -- Convert meters to km
            ELSE 0::FLOAT
        END AS distance_km
    FROM products p
    WHERE 
        -- 1. Search Term (Multi-keyword Fuzzy Search)
        (search_term = '' OR 
         (
             SELECT bool_and(
                 p.title ILIKE '%' || kw || '%' OR 
                 p.description ILIKE '%' || kw || '%' OR
                 p.location_name ILIKE '%' || kw || '%'
             )
             FROM unnest(string_to_array(trim(search_term), ' ')) AS kw
             WHERE kw <> ''
         )
        )
        
        -- 2. Category Filter
        AND (category_filter = 'All' OR p.category = category_filter)
        
        -- 3. Location Name Filter (case insensitive)
        AND (location_filter = 'All Locations' OR p.location_name ILIKE '%' || location_filter || '%')
        
        -- 4. Distance Filter
        AND (
            max_distance_km IS NULL -- 'Any'
            OR max_distance_km = 0 
            OR user_lat IS NULL 
            OR user_lng IS NULL 
            OR p.lat IS NULL 
            OR p.lng IS NULL 
            OR (
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
                    ST_SetSRID(ST_MakePoint(p.lng, p.lat), 4326)::geography
                ) / 1000.0 <= max_distance_km
            )
        )
    ORDER BY p.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
