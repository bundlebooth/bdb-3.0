-- =============================================
-- Stored Procedure: sp_Notification_GetUnreadCount
-- Description: Gets unread notification count for a user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Notification_GetUnreadCount]'))
    DROP PROCEDURE [dbo].[sp_Notification_GetUnreadCount];
GO

CREATE PROCEDURE [dbo].[sp_Notification_GetUnreadCount]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) as UnreadCount
    FROM Notifications 
    WHERE UserID = @UserID AND IsRead = 0;
END
GO
