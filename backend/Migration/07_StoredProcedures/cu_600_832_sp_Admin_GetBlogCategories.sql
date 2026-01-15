-- =============================================
-- Admin - Get Blog Categories
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_GetBlogCategories', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_GetBlogCategories;
GO

CREATE PROCEDURE admin.sp_GetBlogCategories
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT Category, COUNT(*) as PostCount
    FROM content.Blogs
    GROUP BY Category
    ORDER BY Category;
END
GO
