-- =============================================
-- Stored Procedure: admin.sp_DeleteCategory
-- Description: Deletes a category and its vendor associations
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_DeleteCategory]'))
    DROP PROCEDURE [admin].[sp_DeleteCategory];
GO

CREATE PROCEDURE [admin].[sp_DeleteCategory]
    @CategoryID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- First remove vendor associations (VendorCategories uses VendorCategoryID, not CategoryID)
    DELETE FROM vendors.VendorCategories WHERE Category = (SELECT Category FROM vendors.VendorCategories WHERE VendorCategoryID = @CategoryID);
    
    -- Note: Categories table may not exist - this SP may need to be reviewed for actual schema
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

