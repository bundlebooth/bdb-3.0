-- =============================================
-- Stored Procedure: vendors.sp_DeleteSelectedServices
-- Description: Deletes all selected services for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteSelectedServices]'))
    DROP PROCEDURE [vendors].[sp_DeleteSelectedServices];
GO

CREATE PROCEDURE [vendors].[sp_DeleteSelectedServices]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.VendorSelectedServices WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO

