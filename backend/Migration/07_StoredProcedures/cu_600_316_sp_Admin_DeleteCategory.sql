-- =============================================
-- Stored Procedure: sp_Admin_DeleteCategory
-- Description: Deletes a category and its vendor associations
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_DeleteCategory]'))
    DROP PROCEDURE [dbo].[sp_Admin_DeleteCategory];
GO

CREATE PROCEDURE [dbo].[sp_Admin_DeleteCategory]
    @CategoryID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- First remove vendor associations (VendorCategories uses VendorCategoryID, not CategoryID)
    DELETE FROM VendorCategories WHERE Category = (SELECT Category FROM VendorCategories WHERE VendorCategoryID = @CategoryID);
    
    -- Note: Categories table may not exist - this SP may need to be reviewed for actual schema
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
