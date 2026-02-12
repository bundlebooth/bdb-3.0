-- =============================================
-- Stored Procedure: users.sp_LockUserAccount
-- Description: Lock user account after too many failed login attempts
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_LockUserAccount]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_LockUserAccount]
GO

CREATE PROCEDURE [users].[sp_LockUserAccount]
    @UserID INT,
    @LockExpiresAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET IsLocked = 1, 
        LockExpiresAt = @LockExpiresAt,
        LockReason = 'Too many failed login attempts'
    WHERE UserID = @UserID
END
GO
