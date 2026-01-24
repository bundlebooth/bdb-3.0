/*
    Migration Script: Create Stored Procedure [sp_UpdateUserInterests]
    Phase: 700 - Stored Procedures
    Script: pb_700_544_sp_UserInterests_Update.sql
    Description: Updates user interests (replaces all interests)
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateUserInterests]') AND type in (N'P'))
    DROP PROCEDURE [users].[sp_UpdateUserInterests];
GO

CREATE PROCEDURE [users].[sp_UpdateUserInterests]
    @UserID INT,
    @InterestsJSON NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserProfileID INT;
    
    -- Get or create UserProfile
    SELECT @UserProfileID = UserProfileID FROM users.UserProfiles WHERE UserID = @UserID;
    
    IF @UserProfileID IS NULL
    BEGIN
        INSERT INTO users.UserProfiles (UserID) VALUES (@UserID);
        SET @UserProfileID = SCOPE_IDENTITY();
    END
    
    -- Delete existing interests
    DELETE FROM users.UserInterests WHERE UserProfileID = @UserProfileID;
    
    -- Insert new interests from JSON
    IF @InterestsJSON IS NOT NULL AND @InterestsJSON != '' AND @InterestsJSON != '[]'
    BEGIN
        INSERT INTO users.UserInterests (UserProfileID, Interest, Category, DisplayOrder)
        SELECT 
            @UserProfileID,
            JSON_VALUE(value, '$.interest'),
            COALESCE(JSON_VALUE(value, '$.category'), 'General'),
            CAST([key] AS INT)
        FROM OPENJSON(@InterestsJSON);
    END
    
    SELECT @UserProfileID as UserProfileID;
END
GO

PRINT 'Created stored procedure [users].[sp_UpdateUserInterests]';
GO
