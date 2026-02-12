-- =============================================
-- Stored Procedure: users.sp_UpdateFailedLoginAttempts
-- Description: Update failed login attempts count
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateFailedLoginAttempts]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_UpdateFailedLoginAttempts]
GO

CREATE PROCEDURE [users].[sp_UpdateFailedLoginAttempts]
    @UserID INT,
    @FailedAttempts INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET FailedLoginAttempts = @FailedAttempts,
        LastFailedLoginAt = GETDATE()
    WHERE UserID = @UserID
END
GO
