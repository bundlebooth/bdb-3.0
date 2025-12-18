-- =============================================
-- Stored Procedure: sp_Admin_SetVendorVisibility
-- Description: Sets vendor visibility explicitly
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_SetVendorVisibility]'))
    DROP PROCEDURE [dbo].[sp_Admin_SetVendorVisibility];
GO

CREATE PROCEDURE [dbo].[sp_Admin_SetVendorVisibility]
    @VendorProfileID INT,
    @Visible BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET IsVisible = @Visible,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @Visible AS IsVisible;
END
GO
