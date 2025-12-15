-- =============================================
-- Stored Procedure: sp_CheckVendorProfileExists
-- Description: Checks if a vendor profile exists
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CheckVendorProfileExists]'))
    DROP PROCEDURE [dbo].[sp_CheckVendorProfileExists];
GO

CREATE PROCEDURE [dbo].[sp_CheckVendorProfileExists]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT VendorProfileID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
