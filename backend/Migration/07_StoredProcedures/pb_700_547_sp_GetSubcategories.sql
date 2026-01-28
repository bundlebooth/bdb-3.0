/*
    Migration Script: Create Stored Procedure [sp_GetSubcategories]
    Phase: 700 - Stored Procedures
    Script: pb_700_547_sp_GetSubcategories.sql
    Description: Gets subcategories, optionally filtered by category
    
    Execution Order: 547
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetSubcategories]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetSubcategories]'))
    DROP PROCEDURE [admin].[sp_GetSubcategories];
GO

CREATE PROCEDURE [admin].[sp_GetSubcategories]
    @Category NVARCHAR(50) = NULL,
    @IncludeInactive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        SubcategoryID,
        Category,
        SubcategoryKey,
        SubcategoryName,
        Description,
        DisplayOrder,
        IsActive
    FROM [admin].[Subcategories]
    WHERE (@IncludeInactive = 1 OR IsActive = 1)
      AND (@Category IS NULL OR Category = @Category)
    ORDER BY Category, DisplayOrder ASC;
END;
GO

PRINT 'Stored procedure [admin].[sp_GetSubcategories] created successfully.';
GO
