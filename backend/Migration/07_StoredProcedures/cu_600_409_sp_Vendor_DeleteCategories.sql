-- =============================================
-- Stored Procedure: sp_Vendor_DeleteCategories
-- Description: Deletes all categories for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteCategories]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteCategories];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteCategories]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorCategories WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
