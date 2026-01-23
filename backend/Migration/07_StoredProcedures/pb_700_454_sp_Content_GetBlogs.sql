-- =============================================
-- Content - Get Blogs with Pagination
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('content.sp_GetBlogs', 'P') IS NOT NULL
    DROP PROCEDURE content.sp_GetBlogs;
GO

CREATE PROCEDURE content.sp_GetBlogs
    @Category NVARCHAR(100) = NULL,
    @Search NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Get blogs
    SELECT 
        BlogID, Title, Slug, Excerpt, FeaturedImageURL,
        Category, Author, AuthorImageURL, PublishedAt, ViewCount
    FROM content.Blogs
    WHERE Status = 'published'
        AND (@Category IS NULL OR Category = @Category)
        AND (@Search IS NULL OR Title LIKE '%' + @Search + '%' OR Content LIKE '%' + @Search + '%')
    ORDER BY PublishedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Get total count
    SELECT COUNT(*) as total 
    FROM content.Blogs 
    WHERE Status = 'published'
        AND (@Category IS NULL OR Category = @Category)
        AND (@Search IS NULL OR Title LIKE '%' + @Search + '%' OR Content LIKE '%' + @Search + '%');
END
GO
