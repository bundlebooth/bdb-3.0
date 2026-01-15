-- =============================================
-- Content - Get Featured Blogs
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('content.sp_GetFeaturedBlogs', 'P') IS NOT NULL
    DROP PROCEDURE content.sp_GetFeaturedBlogs;
GO

CREATE PROCEDURE content.sp_GetFeaturedBlogs
    @Limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        BlogID, Title, Slug, Excerpt, FeaturedImageURL,
        Category, Author, AuthorImageURL, PublishedAt
    FROM content.Blogs
    WHERE Status = 'published' AND IsFeatured = 1
    ORDER BY PublishedAt DESC;
END
GO
