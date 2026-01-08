-- =============================================
-- Stored Procedure: vendors.sp_UpdateLogoURL
-- Description: Updates vendor logo/featured image
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateLogoURL]'))
    DROP PROCEDURE [vendors].[sp_UpdateLogoURL];
GO

CREATE PROCEDURE [vendors].[sp_UpdateLogoURL]
    @VendorProfileID INT,
    @LogoURL NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET LogoURL = @LogoURL, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

