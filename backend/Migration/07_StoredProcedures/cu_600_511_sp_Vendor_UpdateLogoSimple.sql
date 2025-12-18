-- =============================================
-- Stored Procedure: sp_Vendor_UpdateLogoSimple
-- Description: Updates vendor logo URL (simple version)
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateLogoSimple]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateLogoSimple];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateLogoSimple]
    @VendorProfileID INT,
    @LogoURL NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET LogoURL = @LogoURL, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
