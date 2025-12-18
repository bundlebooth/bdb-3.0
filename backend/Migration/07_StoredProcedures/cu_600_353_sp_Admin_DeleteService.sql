-- =============================================
-- Stored Procedure: sp_Admin_DeleteService
-- Description: Deletes a vendor service
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_DeleteService]'))
    DROP PROCEDURE [dbo].[sp_Admin_DeleteService];
GO

CREATE PROCEDURE [dbo].[sp_Admin_DeleteService]
    @ServiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorServices WHERE ServiceID = @ServiceID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
