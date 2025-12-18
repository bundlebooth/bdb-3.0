-- =============================================
-- Stored Procedure: sp_VendorDashboard_DeleteCategoryAnswers
-- Description: Deletes all category answers for vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_DeleteCategoryAnswers]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_DeleteCategoryAnswers];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_DeleteCategoryAnswers]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorCategoryAnswers WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
