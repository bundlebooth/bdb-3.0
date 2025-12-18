-- =============================================
-- Stored Procedure: vendors.sp_CheckImageExists
-- Description: Checks if a vendor image exists
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_CheckImageExists]'))
    DROP PROCEDURE [vendors].[sp_CheckImageExists];
GO

CREATE PROCEDURE [vendors].[sp_CheckImageExists]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ImageID FROM vendors.VendorImages 
    WHERE VendorProfileID = @VendorProfileID AND ImageURL = @ImageURL;
END
GO

