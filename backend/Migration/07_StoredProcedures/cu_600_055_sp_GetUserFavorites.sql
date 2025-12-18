/*
    Migration Script: Create Stored Procedure [sp_GetUserFavorites]
    Phase: 600 - Stored Procedures
    Script: cu_600_055_dbo.sp_GetUserFavorites.sql
    Description: Creates the [users].[sp_GetFavorites] stored procedure
    
    Execution Order: 55
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetFavorites]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetFavorites]'))
    DROP PROCEDURE [users].[sp_GetFavorites];
GO

CREATE   PROCEDURE [users].[sp_GetFavorites]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_UserFavorites
    WHERE UserID = @UserID
    ORDER BY CreatedAt DESC;
END;

GO

PRINT 'Stored procedure [users].[sp_GetFavorites] created successfully.';
GO
