-- =============================================
-- Stored Procedure: sp_CheckVendorImageExists
-- Description: Checks if a vendor image exists
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CheckVendorImageExists]'))
    DROP PROCEDURE [dbo].[sp_CheckVendorImageExists];
GO

CREATE PROCEDURE [dbo].[sp_CheckVendorImageExists]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ImageID FROM VendorImages 
    WHERE VendorProfileID = @VendorProfileID AND ImageURL = @ImageURL;
END
GO
