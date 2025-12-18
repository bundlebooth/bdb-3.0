-- =============================================
-- Stored Procedure: sp_Vendor_DeleteAllServices
-- Description: Deletes all services for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteAllServices]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteAllServices];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteAllServices]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM Services WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
