-- =============================================
-- Stored Procedure: sp_VendorDashboard_DeleteTeam
-- Description: Deletes all team members for vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_DeleteTeam]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_DeleteTeam];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_DeleteTeam]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorTeam WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
