-- =============================================
-- Stored Procedure: sp_Admin_ToggleVendorVisibility
-- Description: Toggles vendor visibility on the platform
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_ToggleVendorVisibility]'))
    DROP PROCEDURE [dbo].[sp_Admin_ToggleVendorVisibility];
GO

CREATE PROCEDURE [dbo].[sp_Admin_ToggleVendorVisibility]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentVisibility BIT;
    DECLARE @NewVisibility BIT;
    
    SELECT @CurrentVisibility = ISNULL(IsVisible, 0) 
    FROM VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
    
    SET @NewVisibility = CASE WHEN @CurrentVisibility = 1 THEN 0 ELSE 1 END;
    
    UPDATE VendorProfiles 
    SET IsVisible = @NewVisibility,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @NewVisibility AS NewVisibility;
END
GO
