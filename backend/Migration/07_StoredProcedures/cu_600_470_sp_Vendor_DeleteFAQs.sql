-- =============================================
-- Stored Procedure: sp_Vendor_DeleteFAQs
-- Description: Deletes all FAQs for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteFAQs]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteFAQs];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteFAQs]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
