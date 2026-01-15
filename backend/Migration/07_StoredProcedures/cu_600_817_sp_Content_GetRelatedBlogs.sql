-- =============================================
-- Content - Get Related Blogs
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('content.sp_GetRelatedBlogs', 'P') IS NOT NULL
    DROP PROCEDURE content.sp_GetRelatedBlogs;
GO

CREATE PROCEDURE content.sp_GetRelatedBlogs
    @BlogID INT,
    @Category NVARCHAR(100),
    @Limit INT = 3
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        BlogID, Title, Slug, Excerpt, FeaturedImageURL,
        Category, Author, PublishedAt
    FROM content.Blogs
    WHERE Status = 'published' 
        AND BlogID != @BlogID
        AND Category = @Category
    ORDER BY PublishedAt DESC;
END
GO
