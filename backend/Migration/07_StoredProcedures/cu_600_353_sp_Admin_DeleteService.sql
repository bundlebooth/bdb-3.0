-- =============================================
-- Stored Procedure: admin.sp_DeleteService
-- Description: Deletes a vendor service
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_DeleteService]'))
    DROP PROCEDURE [admin].[sp_DeleteService];
GO

CREATE PROCEDURE [admin].[sp_DeleteService]
    @ServiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.VendorServices WHERE ServiceID = @ServiceID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

