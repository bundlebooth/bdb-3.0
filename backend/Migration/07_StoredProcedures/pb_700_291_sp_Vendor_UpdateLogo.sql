-- =============================================
-- Stored Procedure: vendors.sp_UpdateLogo
-- Description: Updates vendor logo URL
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateLogo]'))
    DROP PROCEDURE [vendors].[sp_UpdateLogo];
GO

CREATE PROCEDURE [vendors].[sp_UpdateLogo]
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

