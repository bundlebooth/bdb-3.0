-- =============================================
-- Admin - Update Category Visibility
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('admin.sp_UpdateCategoryVisibility', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_UpdateCategoryVisibility;
GO

CREATE PROCEDURE admin.sp_UpdateCategoryVisibility
    @CategoryID INT,
    @IsVisible BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Add IsVisible column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.VendorCategories') AND name = 'IsVisible')
    BEGIN
        ALTER TABLE dbo.VendorCategories ADD IsVisible BIT DEFAULT 1;
    END
    
    -- Update visibility
    UPDATE dbo.VendorCategories 
    SET IsVisible = @IsVisible, UpdatedAt = GETDATE()
    WHERE CategoryID = @CategoryID;
END
GO
