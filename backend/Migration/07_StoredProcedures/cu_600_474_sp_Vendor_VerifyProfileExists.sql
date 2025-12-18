-- =============================================
-- Stored Procedure: vendors.sp_VerifyProfileExists
-- Description: Verifies a vendor profile exists by ID
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_VerifyProfileExists]'))
    DROP PROCEDURE [vendors].[sp_VerifyProfileExists];
GO

CREATE PROCEDURE [vendors].[sp_VerifyProfileExists]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

