-- =============================================
-- Content - Get Blog Categories
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('content.sp_GetBlogCategories', 'P') IS NOT NULL
    DROP PROCEDURE content.sp_GetBlogCategories;
GO

CREATE PROCEDURE content.sp_GetBlogCategories
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Category, COUNT(*) as PostCount
    FROM content.Blogs
    WHERE Status = 'published'
    GROUP BY Category
    ORDER BY PostCount DESC;
END
GO
