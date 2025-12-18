-- =============================================
-- Stored Procedure: sp_VendorDashboard_DeleteFAQs
-- Description: Deletes all FAQs for vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_DeleteFAQs]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_DeleteFAQs];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_DeleteFAQs]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
