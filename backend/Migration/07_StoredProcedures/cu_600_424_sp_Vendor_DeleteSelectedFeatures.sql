-- =============================================
-- Stored Procedure: sp_Vendor_DeleteSelectedFeatures
-- Description: Deletes all selected features for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteSelectedFeatures]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteSelectedFeatures];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteSelectedFeatures]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorSelectedFeatures WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
