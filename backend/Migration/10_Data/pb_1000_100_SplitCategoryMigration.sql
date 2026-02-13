/*
    Migration Script: Split Combined Categories
    Phase: 1000 - Data
    Script: pb_1000_100_SplitCategoryMigration.sql
    Description: Splits combined categories into separate categories:
                 - photo_video -> photo (existing vendors)
                 - music_dj -> music (existing vendors)
                 - Creates video and dj categories with duplicated questions
    
    Execution Order: 100 (run after other data scripts)
    
    New Category Structure (15 categories):
    venue, photo, video, music, dj, catering, entertainment, experiences,
    decorations, beauty, cake, transportation, planners, fashion, stationery
*/

SET NOCOUNT ON;
GO

PRINT '==============================================';
PRINT 'SPLIT CATEGORY MIGRATION';
PRINT '==============================================';
GO

-- =============================================
-- 1. Update VendorCategories - Split combined categories
-- =============================================
PRINT '';
PRINT '1. Updating vendors.VendorCategories...';

-- Split photo_video -> photo (keeping existing vendors as photo)
UPDATE vendors.VendorCategories 
SET Category = 'photo' 
WHERE Category = 'photo_video';

PRINT '   photo_video -> photo: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';

-- Split music_dj -> music (keeping existing vendors as music)
UPDATE vendors.VendorCategories 
SET Category = 'music' 
WHERE Category = 'music_dj';

PRINT '   music_dj -> music: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';
GO

-- =============================================
-- 2. Update PredefinedServices
-- =============================================
PRINT '';
PRINT '2. Updating admin.PredefinedServices...';

UPDATE admin.PredefinedServices 
SET Category = 'photo' 
WHERE Category = 'photo_video';

PRINT '   photo_video -> photo: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';

UPDATE admin.PredefinedServices 
SET Category = 'music' 
WHERE Category = 'music_dj';

PRINT '   music_dj -> music: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';
GO

-- =============================================
-- 3. Update CategoryQuestions and create duplicates for new categories
-- =============================================
PRINT '';
PRINT '3. Updating admin.CategoryQuestions...';

-- Update photo_video -> photo
UPDATE admin.CategoryQuestions 
SET Category = 'photo' 
WHERE Category = 'photo_video';

PRINT '   photo_video -> photo: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';

-- Duplicate photo questions for video category (if not already exists)
IF NOT EXISTS (SELECT 1 FROM admin.CategoryQuestions WHERE Category = 'video')
BEGIN
    INSERT INTO admin.CategoryQuestions (Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
    SELECT 'video', QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, GETUTCDATE(), GETUTCDATE()
    FROM admin.CategoryQuestions 
    WHERE Category = 'photo';
    
    PRINT '   Duplicated ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' questions for video category';
END
ELSE
BEGIN
    PRINT '   video category already exists, skipping duplication';
END

-- Update music_dj -> music
UPDATE admin.CategoryQuestions 
SET Category = 'music' 
WHERE Category = 'music_dj';

PRINT '   music_dj -> music: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';

-- Duplicate music questions for dj category (if not already exists)
IF NOT EXISTS (SELECT 1 FROM admin.CategoryQuestions WHERE Category = 'dj')
BEGIN
    INSERT INTO admin.CategoryQuestions (Category, QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
    SELECT 'dj', QuestionText, QuestionType, Options, IsRequired, DisplayOrder, IsActive, GETUTCDATE(), GETUTCDATE()
    FROM admin.CategoryQuestions 
    WHERE Category = 'music';
    
    PRINT '   Duplicated ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' questions for dj category';
END
ELSE
BEGIN
    PRINT '   dj category already exists, skipping duplication';
END
GO

-- =============================================
-- 4. Clean up any remaining old category values
-- =============================================
PRINT '';
PRINT '4. Cleaning up any remaining old category values...';

-- VendorCategories cleanup
UPDATE vendors.VendorCategories
SET Category = CASE Category
    WHEN 'decor' THEN 'decorations'
    WHEN 'transport' THEN 'transportation'
    WHEN 'planner' THEN 'planners'
    WHEN 'Venues' THEN 'venue'
    WHEN 'Photo/Video' THEN 'photo'
    WHEN 'Music/DJ' THEN 'music'
    WHEN 'Catering' THEN 'catering'
    WHEN 'Entertainment' THEN 'entertainment'
    WHEN 'Decorations' THEN 'decorations'
    WHEN 'Beauty' THEN 'beauty'
    WHEN 'Cake' THEN 'cake'
    WHEN 'Transportation' THEN 'transportation'
    WHEN 'Planners' THEN 'planners'
    WHEN 'Fashion' THEN 'fashion'
    WHEN 'Stationery' THEN 'stationery'
    ELSE Category
END
WHERE Category IN ('decor', 'transport', 'planner', 'Venues', 'Photo/Video', 'Music/DJ', 
                   'Catering', 'Entertainment', 'Decorations', 'Beauty', 'Cake', 
                   'Transportation', 'Planners', 'Fashion', 'Stationery');

PRINT '   VendorCategories cleanup: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows';
GO

-- =============================================
-- 5. Verification
-- =============================================
PRINT '';
PRINT '==============================================';
PRINT 'VERIFICATION';
PRINT '==============================================';

PRINT '';
PRINT 'Distinct categories in VendorCategories:';
SELECT DISTINCT Category FROM vendors.VendorCategories WHERE Category IS NOT NULL ORDER BY Category;

PRINT '';
PRINT 'Distinct categories in PredefinedServices:';
SELECT DISTINCT Category FROM admin.PredefinedServices WHERE Category IS NOT NULL ORDER BY Category;

PRINT '';
PRINT 'Distinct categories in CategoryQuestions:';
SELECT DISTINCT Category FROM admin.CategoryQuestions WHERE Category IS NOT NULL ORDER BY Category;

PRINT '';
PRINT '==============================================';
PRINT 'MIGRATION COMPLETE';
PRINT '==============================================';
PRINT '';
PRINT 'New category structure:';
PRINT '  venue, photo, video, music, dj, catering, entertainment,';
PRINT '  experiences, decorations, beauty, cake, transportation,';
PRINT '  planners, fashion, stationery';
GO
