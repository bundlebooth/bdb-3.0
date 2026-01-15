-- =============================================
-- Content - Get Blog By Slug
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('content.sp_GetBlogBySlug', 'P') IS NOT NULL
    DROP PROCEDURE content.sp_GetBlogBySlug;
GO

CREATE PROCEDURE content.sp_GetBlogBySlug
    @Slug NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BlogID, Title, Slug, Excerpt, Content, FeaturedImageURL,
        Category, Tags, Author, AuthorImageURL,
        ViewCount, PublishedAt, CreatedAt
    FROM content.Blogs
    WHERE Slug = @Slug AND Status = 'published';
END
GO
