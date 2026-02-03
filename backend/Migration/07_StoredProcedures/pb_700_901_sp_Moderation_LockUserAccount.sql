/*
    Migration Script: Create Stored Procedure [sp_Moderation_LockUserAccount]
    Phase: 700 - Stored Procedures
    Script: pb_700_901_sp_Moderation_LockUserAccount.sql
    Description: Locks a user account due to chat violations and logs the lock history
    Schema: admin
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_LockUserAccount]...';
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_LockUserAccount]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [admin].[sp_LockUserAccount];
END
GO

CREATE PROCEDURE [admin].[sp_LockUserAccount]
    @UserID INT,
    @LockType VARCHAR(50),
    @LockReason NVARCHAR(500),
    @ViolationCount INT = 0,
    @RelatedViolationIDs NVARCHAR(500) = NULL,
    @LockedByAdminID INT = NULL,
    @LockDuration INT = NULL -- Duration in minutes, NULL = permanent
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @LockHistoryID INT;
    DECLARE @LockExpiresAt DATETIME = NULL;
    DECLARE @UserEmail NVARCHAR(100);
    DECLARE @UserName NVARCHAR(200);
    
    -- Calculate lock expiration if duration is specified
    IF @LockDuration IS NOT NULL
    BEGIN
        SET @LockExpiresAt = DATEADD(MINUTE, @LockDuration, GETDATE());
    END
    
    -- Update the user's lock status
    UPDATE [users].[Users]
    SET 
        IsLocked = 1,
        LockExpiresAt = @LockExpiresAt,
        LockReason = @LockReason
    WHERE UserID = @UserID;
    
    -- Insert lock history record
    INSERT INTO [admin].[UserLockHistory] (
        UserID, LockType, LockReason, ViolationCount, 
        RelatedViolationIDs, LockedByAdminID, LockDuration, LockExpiresAt
    )
    VALUES (
        @UserID, @LockType, @LockReason, @ViolationCount,
        @RelatedViolationIDs, @LockedByAdminID, @LockDuration, @LockExpiresAt
    );
    
    SET @LockHistoryID = SCOPE_IDENTITY();
    
    -- Get user info for email notification
    SELECT 
        @UserEmail = Email,
        @UserName = COALESCE(FirstName + ' ' + LastName, FirstName, 'User')
    FROM [users].[Users]
    WHERE UserID = @UserID;
    
    -- Return lock info for email notification
    SELECT 
        @LockHistoryID AS LockHistoryID,
        @UserID AS UserID,
        @UserEmail AS Email,
        @UserName AS UserName,
        @LockType AS LockType,
        @LockReason AS LockReason,
        @LockExpiresAt AS LockExpiresAt,
        @ViolationCount AS ViolationCount;
END
GO

PRINT 'Stored procedure [admin].[sp_LockUserAccount] created successfully.';
GO
