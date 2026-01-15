-- =============================================
-- Admin - Delete Blog
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_DeleteBlog', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_DeleteBlog;
GO

CREATE PROCEDURE admin.sp_DeleteBlog
    @BlogID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM content.Blogs WHERE BlogID = @BlogID;
END
GO
