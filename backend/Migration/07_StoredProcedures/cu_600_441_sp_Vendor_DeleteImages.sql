-- =============================================
-- Stored Procedure: sp_Vendor_DeleteImages
-- Description: Deletes all images for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteImages]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteImages];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteImages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorImages WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
