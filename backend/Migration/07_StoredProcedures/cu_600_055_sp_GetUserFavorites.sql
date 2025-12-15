/*
    Migration Script: Create Stored Procedure [sp_GetUserFavorites]
    Phase: 600 - Stored Procedures
    Script: cu_600_055_dbo.sp_GetUserFavorites.sql
    Description: Creates the [dbo].[sp_GetUserFavorites] stored procedure
    
    Execution Order: 55
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetUserFavorites]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetUserFavorites]'))
    DROP PROCEDURE [dbo].[sp_GetUserFavorites];
GO

CREATE   PROCEDURE [dbo].[sp_GetUserFavorites]
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

PRINT 'Stored procedure [dbo].[sp_GetUserFavorites] created successfully.';
GO
