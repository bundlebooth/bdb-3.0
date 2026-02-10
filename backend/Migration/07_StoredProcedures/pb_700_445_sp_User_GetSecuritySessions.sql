-- =============================================
-- Stored Procedure: users.sp_GetSecuritySessions
-- Description: Gets user's login sessions/security activity history
-- Phase: 700 (Stored Procedures)
-- Schema: users
-- =============================================

SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetSecuritySessions]'))
    DROP PROCEDURE [users].[sp_GetSecuritySessions];
GO

CREATE PROCEDURE [users].[sp_GetSecuritySessions]
    @UserID INT,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get login sessions from SecurityLogs
    SELECT TOP (@Limit)
        LogID,
        Action,
        ActionStatus,
        IPAddress,
        UserAgent,
        Location,
        Device,
        Details,
        CreatedAt
    FROM users.SecurityLogs
    WHERE UserID = @UserID
        AND Action IN ('Login', 'Logout', 'LoginFailed', 'PasswordResetRequested', 'PasswordResetCompleted', '2FAEnabled', '2FADisabled', 'LogoutAllDevices')
    ORDER BY CreatedAt DESC;
    
    -- Get last successful login
    SELECT TOP 1 
        CreatedAt,
        IPAddress,
        Location,
        Device,
        UserAgent
    FROM users.SecurityLogs
    WHERE UserID = @UserID 
        AND Action = 'Login' 
        AND ActionStatus = 'Success'
    ORDER BY CreatedAt DESC;
    
    -- Get user's 2FA status
    SELECT ISNULL(TwoFactorEnabled, 0) as TwoFactorEnabled
    FROM users.Users
    WHERE UserID = @UserID;
END
GO

PRINT 'Created stored procedure users.sp_GetSecuritySessions';
GO
