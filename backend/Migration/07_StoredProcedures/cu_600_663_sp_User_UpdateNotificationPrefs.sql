-- =============================================
-- Stored Procedure: sp_User_UpdateNotificationPrefs
-- Description: Updates user notification preferences
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_UpdateNotificationPrefs]'))
    DROP PROCEDURE [dbo].[sp_User_UpdateNotificationPrefs];
GO

CREATE PROCEDURE [dbo].[sp_User_UpdateNotificationPrefs]
    @UserID INT,
    @Preferences NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users 
    SET NotificationPreferences = @Preferences, UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
END
GO
