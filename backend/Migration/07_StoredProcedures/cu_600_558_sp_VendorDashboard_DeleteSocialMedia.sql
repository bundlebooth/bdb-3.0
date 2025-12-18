-- =============================================
-- Stored Procedure: sp_VendorDashboard_DeleteSocialMedia
-- Description: Deletes all social media for vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_DeleteSocialMedia]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_DeleteSocialMedia];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_DeleteSocialMedia]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
