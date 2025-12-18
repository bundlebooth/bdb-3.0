-- =============================================
-- Stored Procedure: sp_Vendor_DeleteServiceAreas
-- Description: Deletes all service areas for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteServiceAreas]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteServiceAreas];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteServiceAreas]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
