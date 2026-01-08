-- =============================================
-- Stored Procedure: notifications.sp_MarkRead
-- Description: Marks a notification as read
-- Phase: 600 (Stored Procedures)
-- Schema: notifications
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[notifications].[sp_MarkRead]'))
    DROP PROCEDURE [notifications].[sp_MarkRead];
GO

CREATE PROCEDURE [notifications].[sp_MarkRead]
    @NotificationID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE notifications.Notifications 
    SET IsRead = 1, ReadAt = GETDATE()
    WHERE NotificationID = @NotificationID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

