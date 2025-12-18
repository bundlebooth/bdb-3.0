-- =============================================
-- Stored Procedure: sp_Vendor_VerifyProfileExists
-- Description: Verifies a vendor profile exists by ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_VerifyProfileExists]'))
    DROP PROCEDURE [dbo].[sp_Vendor_VerifyProfileExists];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_VerifyProfileExists]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
