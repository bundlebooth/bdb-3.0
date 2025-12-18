-- =============================================
-- Stored Procedure: sp_Vendor_DeleteCategoryAnswers
-- Description: Deletes all category answers for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteCategoryAnswers]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteCategoryAnswers];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteCategoryAnswers]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorCategoryAnswers 
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
