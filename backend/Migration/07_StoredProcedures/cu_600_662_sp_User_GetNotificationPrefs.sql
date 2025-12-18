-- =============================================
-- Stored Procedure: users.sp_GetNotificationPrefs
-- Description: Gets user notification preferences
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetNotificationPrefs]'))
    DROP PROCEDURE [users].[sp_GetNotificationPrefs];
GO

CREATE PROCEDURE [users].[sp_GetNotificationPrefs]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT NotificationPreferences 
    FROM users.Users 
    WHERE UserID = @UserID;
END
GO

