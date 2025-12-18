-- =============================================
-- Stored Procedure: sp_Vendor_UpdateLogoURL
-- Description: Updates vendor logo/featured image
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateLogoURL]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateLogoURL];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateLogoURL]
    @VendorProfileID INT,
    @LogoURL NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET LogoURL = @LogoURL, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
