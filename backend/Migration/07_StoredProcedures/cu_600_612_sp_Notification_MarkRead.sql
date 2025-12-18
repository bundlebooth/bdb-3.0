-- =============================================
-- Stored Procedure: sp_Notification_MarkRead
-- Description: Marks a notification as read
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Notification_MarkRead]'))
    DROP PROCEDURE [dbo].[sp_Notification_MarkRead];
GO

CREATE PROCEDURE [dbo].[sp_Notification_MarkRead]
    @NotificationID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Notifications 
    SET IsRead = 1, ReadAt = GETDATE()
    WHERE NotificationID = @NotificationID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
