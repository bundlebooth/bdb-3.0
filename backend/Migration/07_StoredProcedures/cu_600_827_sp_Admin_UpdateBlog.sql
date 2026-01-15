-- =============================================
-- Admin - Update Blog
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_UpdateBlog', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_UpdateBlog;
GO

CREATE PROCEDURE admin.sp_UpdateBlog
    @BlogID INT,
    @Title NVARCHAR(255),
    @Slug NVARCHAR(255),
    @Excerpt NVARCHAR(500),
    @Content NVARCHAR(MAX),
    @FeaturedImageURL NVARCHAR(500),
    @Category NVARCHAR(100),
    @Tags NVARCHAR(500),
    @Author NVARCHAR(100),
    @AuthorImageURL NVARCHAR(500),
    @Status NVARCHAR(50),
    @IsFeatured BIT,
    @SetPublishedAt BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE content.Blogs SET
        Title = @Title,
        Slug = @Slug,
        Excerpt = @Excerpt,
        Content = @Content,
        FeaturedImageURL = @FeaturedImageURL,
        Category = @Category,
        Tags = @Tags,
        Author = @Author,
        AuthorImageURL = @AuthorImageURL,
        Status = @Status,
        IsFeatured = @IsFeatured,
        UpdatedAt = GETDATE(),
        PublishedAt = CASE WHEN @SetPublishedAt = 1 THEN GETDATE() ELSE PublishedAt END
    WHERE BlogID = @BlogID;
END
GO
