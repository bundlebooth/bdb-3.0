-- =============================================
-- Stored Procedure: vendors.sp_DeleteSelectedFeatures
-- Description: Deletes all selected features for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteSelectedFeatures]'))
    DROP PROCEDURE [vendors].[sp_DeleteSelectedFeatures];
GO

CREATE PROCEDURE [vendors].[sp_DeleteSelectedFeatures]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.VendorSelectedFeatures WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO

