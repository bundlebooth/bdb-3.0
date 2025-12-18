-- =============================================
-- Stored Procedure: sp_VendorDashboard_DeleteServiceAreas
-- Description: Deletes all service areas for vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_DeleteServiceAreas]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_DeleteServiceAreas];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_DeleteServiceAreas]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
