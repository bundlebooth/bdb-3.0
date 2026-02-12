-- =============================================
-- Stored Procedure: users.sp_ResetLoginAttempts
-- Description: Reset login attempts after successful login
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_ResetLoginAttempts]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_ResetLoginAttempts]
GO

CREATE PROCEDURE [users].[sp_ResetLoginAttempts]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET FailedLoginAttempts = 0,
        IsLocked = 0,
        LockExpiresAt = NULL,
        LockReason = NULL
    WHERE UserID = @UserID
END
GO
