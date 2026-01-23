-- =============================================
-- Admin - Unpublish Blog
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_UnpublishBlog', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_UnpublishBlog;
GO

CREATE PROCEDURE admin.sp_UnpublishBlog
    @BlogID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE content.Blogs SET
        Status = 'draft',
        UpdatedAt = GETDATE()
    WHERE BlogID = @BlogID;
END
GO
