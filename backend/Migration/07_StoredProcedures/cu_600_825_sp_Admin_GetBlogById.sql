-- =============================================
-- Admin - Get Blog By ID
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_GetBlogById', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_GetBlogById;
GO

CREATE PROCEDURE admin.sp_GetBlogById
    @BlogID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BlogID, Title, Slug, Excerpt, Content, FeaturedImageURL,
        Category, Tags, Author, AuthorImageURL, Status,
        IsFeatured, ViewCount, PublishedAt, CreatedAt, UpdatedAt
    FROM content.Blogs
    WHERE BlogID = @BlogID;
END
GO
