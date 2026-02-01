-- =============================================
-- Stored Procedure: users.sp_GetNotificationPrefs
-- Description: Gets user notification preferences
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetNotificationPrefs]'))
    DROP PROCEDURE [users].[sp_GetNotificationPrefs];
GO

CREATE PROCEDURE [users].[sp_GetNotificationPrefs]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        NotificationPreferences,
        ISNULL(UnsubscribedFromAll, 0) AS UnsubscribedFromAll,
        UnsubscribedAt
    FROM users.Users 
    WHERE UserID = @UserID;
END
GO

