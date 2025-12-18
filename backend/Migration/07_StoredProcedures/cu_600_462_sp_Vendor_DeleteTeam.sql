-- =============================================
-- Stored Procedure: sp_Vendor_DeleteTeam
-- Description: Deletes all team members for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteTeam]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteTeam];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteTeam]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorTeam WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
