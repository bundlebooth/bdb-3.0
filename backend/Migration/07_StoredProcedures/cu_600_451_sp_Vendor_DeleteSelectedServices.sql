-- =============================================
-- Stored Procedure: sp_Vendor_DeleteSelectedServices
-- Description: Deletes all selected services for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteSelectedServices]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteSelectedServices];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteSelectedServices]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorSelectedServices WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
