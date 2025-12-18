-- =============================================
-- Stored Procedure: sp_Notification_MarkAllRead
-- Description: Marks all notifications as read for a user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Notification_MarkAllRead]'))
    DROP PROCEDURE [dbo].[sp_Notification_MarkAllRead];
GO

CREATE PROCEDURE [dbo].[sp_Notification_MarkAllRead]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Notifications 
    SET IsRead = 1, ReadAt = GETDATE()
    WHERE UserID = @UserID AND IsRead = 0;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
