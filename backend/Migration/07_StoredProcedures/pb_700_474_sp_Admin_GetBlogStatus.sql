-- =============================================
-- Admin - Get Blog Status
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_GetBlogStatus', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_GetBlogStatus;
GO

CREATE PROCEDURE admin.sp_GetBlogStatus
    @BlogID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Status, PublishedAt 
    FROM content.Blogs 
    WHERE BlogID = @BlogID;
END
GO
