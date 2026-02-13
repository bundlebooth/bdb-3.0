/*
    Migration Script: Update Categories to Snake Case
    Phase: 1000 - Data
    Script: pb_1000_99_UpdateCategoriesToSnakeCase.sql
    Description: Updates all category values to consistent snake_case format
    
    Execution Order: 99 (run after other data scripts)
    
    Tables Updated:
    - admin.PredefinedServices
    - admin.CategoryQuestions
    - vendors.VendorCategories (already done, included for completeness)
*/

SET NOCOUNT ON;
GO

PRINT '==============================================';
PRINT 'Updating categories to snake_case format...';
PRINT '==============================================';
GO

-- =============================================
-- 1. Update admin.PredefinedServices.Category
-- =============================================
PRINT '';
PRINT '1. Updating admin.PredefinedServices.Category...';

UPDATE admin.PredefinedServices
SET Category = CASE Category
    WHEN 'Photography' THEN 'photo_video'
    WHEN 'Venue' THEN 'venue'
    WHEN 'Wedding' THEN 'photo_video'  -- Wedding services map to photo_video
    WHEN 'Catering' THEN 'catering'
    WHEN 'Music & Entertainment' THEN 'music_dj'
    WHEN 'Event Planning' THEN 'planners'
    WHEN 'Floral & Decor' THEN 'decorations'
    WHEN 'Beauty & Wellness' THEN 'beauty'
    WHEN 'Transportation' THEN 'transportation'
    WHEN 'Entertainment' THEN 'entertainment'
    WHEN 'Experiences' THEN 'experiences'
    WHEN 'Cake' THEN 'cake'
    WHEN 'Fashion' THEN 'fashion'
    WHEN 'Stationery' THEN 'stationery'
    ELSE Category
END
WHERE Category IS NOT NULL;

PRINT 'PredefinedServices updated: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';
GO

-- =============================================
-- 2. Update admin.CategoryQuestions.Category
-- =============================================
PRINT '';
PRINT '2. Updating admin.CategoryQuestions.Category...';

UPDATE admin.CategoryQuestions
SET Category = CASE Category
    WHEN 'photo' THEN 'photo_video'
    WHEN 'music' THEN 'music_dj'
    WHEN 'decor' THEN 'decorations'
    WHEN 'transport' THEN 'transportation'
    WHEN 'planner' THEN 'planners'
    ELSE Category
END
WHERE Category IS NOT NULL;

PRINT 'CategoryQuestions updated: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';
GO

-- =============================================
-- 3. Verify vendors.VendorCategories (should already be done)
-- =============================================
PRINT '';
PRINT '3. Verifying vendors.VendorCategories...';

-- Update any remaining old values
UPDATE vendors.VendorCategories
SET Category = CASE Category
    WHEN 'photo' THEN 'photo_video'
    WHEN 'videography' THEN 'photo_video'
    WHEN 'music' THEN 'music_dj'
    WHEN 'decor' THEN 'decorations'
    WHEN 'transport' THEN 'transportation'
    WHEN 'planner' THEN 'planners'
    WHEN 'Venues' THEN 'venue'
    WHEN 'Photo/Video' THEN 'photo_video'
    WHEN 'Music/DJ' THEN 'music_dj'
    WHEN 'Catering' THEN 'catering'
    WHEN 'Entertainment' THEN 'entertainment'
    WHEN 'Experiences' THEN 'experiences'
    WHEN 'Decorations' THEN 'decorations'
    WHEN 'Beauty' THEN 'beauty'
    WHEN 'Cake' THEN 'cake'
    WHEN 'Transportation' THEN 'transportation'
    WHEN 'Planners' THEN 'planners'
    WHEN 'Fashion' THEN 'fashion'
    WHEN 'Stationery' THEN 'stationery'
    ELSE Category
END
WHERE Category IS NOT NULL;

PRINT 'VendorCategories updated: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';
GO

-- =============================================
-- Verification Queries
-- =============================================
PRINT '';
PRINT '==============================================';
PRINT 'VERIFICATION';
PRINT '==============================================';

PRINT '';
PRINT 'Distinct categories in PredefinedServices:';
SELECT DISTINCT Category FROM admin.PredefinedServices WHERE Category IS NOT NULL ORDER BY Category;

PRINT '';
PRINT 'Distinct categories in CategoryQuestions:';
SELECT DISTINCT Category FROM admin.CategoryQuestions WHERE Category IS NOT NULL ORDER BY Category;

PRINT '';
PRINT 'Distinct categories in VendorCategories:';
SELECT DISTINCT Category FROM vendors.VendorCategories WHERE Category IS NOT NULL ORDER BY Category;

PRINT '';
PRINT '==============================================';
PRINT 'Category migration complete!';
PRINT '==============================================';
GO
