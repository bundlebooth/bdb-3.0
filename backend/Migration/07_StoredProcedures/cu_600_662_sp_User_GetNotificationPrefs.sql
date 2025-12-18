-- =============================================
-- Stored Procedure: sp_User_GetNotificationPrefs
-- Description: Gets user notification preferences
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_GetNotificationPrefs]'))
    DROP PROCEDURE [dbo].[sp_User_GetNotificationPrefs];
GO

CREATE PROCEDURE [dbo].[sp_User_GetNotificationPrefs]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT NotificationPreferences 
    FROM Users 
    WHERE UserID = @UserID;
END
GO
