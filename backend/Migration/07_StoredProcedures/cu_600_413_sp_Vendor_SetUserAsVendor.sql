-- =============================================
-- Stored Procedure: vendors.sp_SetUserAsVendor
-- Description: Updates user to be a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_SetUserAsVendor]'))
    DROP PROCEDURE [vendors].[sp_SetUserAsVendor];
GO

CREATE PROCEDURE [vendors].[sp_SetUserAsVendor]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users SET IsVendor = 1 WHERE UserID = @UserID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

