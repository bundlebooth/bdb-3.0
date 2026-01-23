/*
    Migration Script: Create Stored Procedure [sp_GetUserNotifications]
    Phase: 600 - Stored Procedures
    Script: cu_600_056_dbo.sp_GetUserNotifications.sql
    Description: Creates the [notifications].[sp_GetUserNotifications] stored procedure
    
    Execution Order: 56
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [notifications].[sp_GetUserNotifications]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[notifications].[sp_GetUserNotifications]'))
    DROP PROCEDURE [notifications].[sp_GetUserNotifications];
GO

CREATE   PROCEDURE [notifications].[sp_GetUserNotifications]
    @UserID INT,
    @UnreadOnly BIT = 0,
    @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        n.NotificationID,
        n.Type,
        n.Title,
        n.Message,
        n.IsRead,
        n.ReadAt,
        n.RelatedID,
        n.RelatedType,
        n.ActionURL,
        n.CreatedAt,
        CASE 
            WHEN n.Type = 'booking' THEN (SELECT b.Status FROM bookings.Bookings b WHERE b.BookingID = n.RelatedID)
            ELSE NULL
        END AS Status
    FROM notifications.Notifications n
    WHERE n.UserID = @UserID
    AND (@UnreadOnly = 0 OR n.IsRead = 0)
    ORDER BY n.CreatedAt DESC;
    
    -- Mark as read if fetching unread
    IF @UnreadOnly = 1
    BEGIN
        UPDATE notifications.Notifications
        SET IsRead = 1,
            ReadAt = GETDATE()
        WHERE UserID = @UserID
        AND IsRead = 0;
    END
END;

GO

PRINT 'Stored procedure [notifications].[sp_GetUserNotifications] created successfully.';
GO


