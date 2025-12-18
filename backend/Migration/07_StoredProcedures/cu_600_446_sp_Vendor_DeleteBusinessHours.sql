-- =============================================
-- Stored Procedure: sp_Vendor_DeleteBusinessHours
-- Description: Deletes all business hours for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteBusinessHours]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteBusinessHours];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteBusinessHours]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
