-- =============================================
-- Stored Procedure: sp_Vendor_DeleteServiceCategories
-- Description: Deletes all service categories for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteServiceCategories]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteServiceCategories];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteServiceCategories]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM ServiceCategories WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
