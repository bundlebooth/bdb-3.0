-- =============================================
-- Stored Procedure: users.sp_UpdatePasswordAfterReset
-- Description: Update password after password reset
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_UpdatePasswordAfterReset]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_UpdatePasswordAfterReset]
GO

CREATE PROCEDURE [users].[sp_UpdatePasswordAfterReset]
    @UserID INT,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET PasswordHash = @PasswordHash,
        FailedLoginAttempts = 0,
        IsLocked = 0,
        LockExpiresAt = NULL,
        LockReason = NULL
    WHERE UserID = @UserID
END
GO
