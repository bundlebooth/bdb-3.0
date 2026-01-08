-- =============================================
-- Stored Procedure: users.sp_UpdateNotificationPrefs
-- Description: Updates user notification preferences
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateNotificationPrefs]'))
    DROP PROCEDURE [users].[sp_UpdateNotificationPrefs];
GO

CREATE PROCEDURE [users].[sp_UpdateNotificationPrefs]
    @UserID INT,
    @Preferences NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET NotificationPreferences = @Preferences, UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
END
GO

