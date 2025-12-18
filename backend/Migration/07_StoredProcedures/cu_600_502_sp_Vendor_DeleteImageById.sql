-- =============================================
-- Stored Procedure: sp_Vendor_DeleteImageById
-- Description: Deletes a specific image for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteImageById]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteImageById];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteImageById]
    @VendorProfileID INT,
    @ImageID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorImages 
    WHERE VendorProfileID = @VendorProfileID AND ImageID = @ImageID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
