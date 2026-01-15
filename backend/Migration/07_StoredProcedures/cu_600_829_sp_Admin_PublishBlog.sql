-- =============================================
-- Admin - Publish Blog
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_PublishBlog', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_PublishBlog;
GO

CREATE PROCEDURE admin.sp_PublishBlog
    @BlogID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE content.Blogs SET
        Status = 'published',
        PublishedAt = COALESCE(PublishedAt, GETDATE()),
        UpdatedAt = GETDATE()
    WHERE BlogID = @BlogID;
END
GO
