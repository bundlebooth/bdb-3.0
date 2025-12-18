-- =============================================
-- Stored Procedure: vendors.sp_UpdateLogoSimple
-- Description: Updates vendor logo URL (simple version)
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateLogoSimple]'))
    DROP PROCEDURE [vendors].[sp_UpdateLogoSimple];
GO

CREATE PROCEDURE [vendors].[sp_UpdateLogoSimple]
    @VendorProfileID INT,
    @LogoURL NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET LogoURL = @LogoURL, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

