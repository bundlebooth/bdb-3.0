/*
    Migration Script: Create Stored Procedure [sp_GetUserInterests]
    Phase: 700 - Stored Procedures
    Script: pb_700_543_sp_UserInterests_Get.sql
    Description: Gets user interests by UserID
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserInterests]') AND type in (N'P'))
    DROP PROCEDURE [users].[sp_GetUserInterests];
GO

CREATE PROCEDURE [users].[sp_GetUserInterests]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT ui.UserInterestID, ui.Interest, ui.Category, ui.DisplayOrder
    FROM users.UserInterests ui
    INNER JOIN users.UserProfiles up ON ui.UserProfileID = up.UserProfileID
    WHERE up.UserID = @UserID
    ORDER BY ui.DisplayOrder;
END
GO

PRINT 'Created stored procedure [users].[sp_GetUserInterests]';
GO
