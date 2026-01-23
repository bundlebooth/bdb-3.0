-- =============================================
-- Admin - Create Blog
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_CreateBlog', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_CreateBlog;
GO

CREATE PROCEDURE admin.sp_CreateBlog
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
    @PublishedAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO content.Blogs (
        Title, Slug, Excerpt, Content, FeaturedImageURL,
        Category, Tags, Author, AuthorImageURL, Status,
        IsFeatured, PublishedAt, CreatedAt, UpdatedAt
    )
    OUTPUT INSERTED.BlogID
    VALUES (
        @Title, @Slug, @Excerpt, @Content, @FeaturedImageURL,
        @Category, @Tags, @Author, @AuthorImageURL, @Status,
        @IsFeatured, @PublishedAt, GETDATE(), GETDATE()
    );
END
GO
