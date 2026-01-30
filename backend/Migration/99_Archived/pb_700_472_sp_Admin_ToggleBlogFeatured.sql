-- =============================================
-- Admin - Toggle Blog Featured
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_ToggleBlogFeatured', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_ToggleBlogFeatured;
GO

CREATE PROCEDURE admin.sp_ToggleBlogFeatured
    @BlogID INT,
    @IsFeatured BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE content.Blogs SET
        IsFeatured = @IsFeatured,
        UpdatedAt = GETDATE()
    WHERE BlogID = @BlogID;
END
GO
