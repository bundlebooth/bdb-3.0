/*
    Migration Script: Create Stored Procedure [sp_GetCultures]
    Phase: 700 - Stored Procedures
    Script: pb_700_553_sp_GetCultures.sql
    Description: Gets all active cultures for lookup
    
    Execution Order: 553
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetCultures]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetCultures]'))
    DROP PROCEDURE [admin].[sp_GetCultures];
GO

CREATE PROCEDURE [admin].[sp_GetCultures]
    @IncludeInactive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CultureID,
        CultureKey,
        CultureName,
        DisplayOrder,
        IsActive
    FROM [admin].[Cultures]
    WHERE (@IncludeInactive = 1 OR IsActive = 1)
    ORDER BY DisplayOrder ASC;
END;
GO

PRINT 'Stored procedure [admin].[sp_GetCultures] created successfully.';
GO
