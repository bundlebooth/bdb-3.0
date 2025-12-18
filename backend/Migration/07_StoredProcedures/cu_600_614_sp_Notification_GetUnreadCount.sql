-- =============================================
-- Stored Procedure: notifications.sp_GetUnreadCount
-- Description: Gets unread notification count for a user
-- Phase: 600 (Stored Procedures)
-- Schema: notifications
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[notifications].[sp_GetUnreadCount]'))
    DROP PROCEDURE [notifications].[sp_GetUnreadCount];
GO

CREATE PROCEDURE [notifications].[sp_GetUnreadCount]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) as UnreadCount
    FROM notifications.Notifications 
    WHERE UserID = @UserID AND IsRead = 0;
END
GO

