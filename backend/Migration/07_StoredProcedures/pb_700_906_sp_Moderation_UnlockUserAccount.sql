/*
    Migration Script: Create Stored Procedure [sp_Moderation_UnlockUserAccount]
    Phase: 700 - Stored Procedures
    Script: pb_700_906_sp_Moderation_UnlockUserAccount.sql
    Description: Unlocks a user account and updates lock history
    Schema: admin
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_UnlockUserAccount]...';
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_UnlockUserAccount]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [admin].[sp_UnlockUserAccount];
END
GO

CREATE PROCEDURE [admin].[sp_UnlockUserAccount]
    @UserID INT,
    @UnlockedByAdminID INT,
    @UnlockReason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update the user's lock status
    UPDATE [users].[Users]
    SET 
        IsLocked = 0,
        LockExpiresAt = NULL,
        LockReason = NULL
    WHERE UserID = @UserID;
    
    -- Update the active lock history record
    UPDATE [admin].[UserLockHistory]
    SET 
        IsActive = 0,
        UnlockedAt = GETDATE(),
        UnlockedByAdminID = @UnlockedByAdminID,
        UnlockReason = @UnlockReason
    WHERE UserID = @UserID AND IsActive = 1;
    
    -- Return success
    SELECT 
        @UserID AS UserID,
        0 AS IsLocked,
        'Account unlocked successfully' AS Message;
END
GO

PRINT 'Stored procedure [admin].[sp_UnlockUserAccount] created successfully.';
GO
