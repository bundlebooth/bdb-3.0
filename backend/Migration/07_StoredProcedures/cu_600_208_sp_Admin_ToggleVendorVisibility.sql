-- =============================================
-- Stored Procedure: admin.sp_ToggleVendorVisibility
-- Description: Toggles vendor visibility on the platform
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_ToggleVendorVisibility]'))
    DROP PROCEDURE [admin].[sp_ToggleVendorVisibility];
GO

CREATE PROCEDURE [admin].[sp_ToggleVendorVisibility]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentVisibility BIT;
    DECLARE @NewVisibility BIT;
    
    SELECT @CurrentVisibility = ISNULL(IsVisible, 0) 
    FROM vendors.VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
    
    SET @NewVisibility = CASE WHEN @CurrentVisibility = 1 THEN 0 ELSE 1 END;
    
    UPDATE vendors.VendorProfiles 
    SET IsVisible = @NewVisibility,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @NewVisibility AS NewVisibility;
END
GO

