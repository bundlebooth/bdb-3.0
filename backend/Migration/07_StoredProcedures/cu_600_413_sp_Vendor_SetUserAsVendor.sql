-- =============================================
-- Stored Procedure: sp_Vendor_SetUserAsVendor
-- Description: Updates user to be a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_SetUserAsVendor]'))
    DROP PROCEDURE [dbo].[sp_Vendor_SetUserAsVendor];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_SetUserAsVendor]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users SET IsVendor = 1 WHERE UserID = @UserID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
