-- =============================================
-- Stored Procedure: vendors.sp_DeleteCategoryAnswers
-- Description: Deletes all category answers for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteCategoryAnswers]'))
    DROP PROCEDURE [vendors].[sp_DeleteCategoryAnswers];
GO

CREATE PROCEDURE [vendors].[sp_DeleteCategoryAnswers]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorCategoryAnswers 
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
