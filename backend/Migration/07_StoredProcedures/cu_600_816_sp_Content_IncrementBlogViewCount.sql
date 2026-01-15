-- =============================================
-- Content - Increment Blog View Count
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('content.sp_IncrementBlogViewCount', 'P') IS NOT NULL
    DROP PROCEDURE content.sp_IncrementBlogViewCount;
GO

CREATE PROCEDURE content.sp_IncrementBlogViewCount
    @Slug NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE content.Blogs 
    SET ViewCount = ISNULL(ViewCount, 0) + 1 
    WHERE Slug = @Slug;
END
GO
