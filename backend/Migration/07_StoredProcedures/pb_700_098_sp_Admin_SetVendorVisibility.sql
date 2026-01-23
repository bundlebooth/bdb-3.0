-- =============================================
-- Stored Procedure: admin.sp_SetVendorVisibility
-- Description: Sets vendor visibility explicitly
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_SetVendorVisibility]'))
    DROP PROCEDURE [admin].[sp_SetVendorVisibility];
GO

CREATE PROCEDURE [admin].[sp_SetVendorVisibility]
    @VendorProfileID INT,
    @Visible BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET IsVisible = @Visible,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @Visible AS IsVisible;
END
GO

