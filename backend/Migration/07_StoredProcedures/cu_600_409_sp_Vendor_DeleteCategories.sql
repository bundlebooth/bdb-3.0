-- =============================================
-- Stored Procedure: vendors.sp_DeleteCategories
-- Description: Deletes all categories for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteCategories]'))
    DROP PROCEDURE [vendors].[sp_DeleteCategories];
GO

CREATE PROCEDURE [vendors].[sp_DeleteCategories]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.VendorCategories WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO

