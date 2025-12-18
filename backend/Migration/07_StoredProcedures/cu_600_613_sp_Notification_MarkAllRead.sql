-- =============================================
-- Stored Procedure: notifications.sp_MarkAllRead
-- Description: Marks all notifications as read for a user
-- Phase: 600 (Stored Procedures)
-- Schema: notifications
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[notifications].[sp_MarkAllRead]'))
    DROP PROCEDURE [notifications].[sp_MarkAllRead];
GO

CREATE PROCEDURE [notifications].[sp_MarkAllRead]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE notifications.Notifications 
    SET IsRead = 1, ReadAt = GETDATE()
    WHERE UserID = @UserID AND IsRead = 0;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

