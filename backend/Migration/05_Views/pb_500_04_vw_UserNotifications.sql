/*
    Migration Script: Create View [vw_UserNotifications]
    Phase: 400 - Views
    Script: cu_400_05_dbo.vw_UserNotifications.sql
    Description: Creates the [notifications].[vw_UserNotifications] view
    
    Execution Order: 5
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [notifications].[vw_UserNotifications]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[notifications].[vw_UserNotifications]'))
    DROP VIEW [notifications].[vw_UserNotifications];
GO

CREATE VIEW [notifications].[vw_UserNotifications] AS
SELECT 
    n.NotificationID,
    n.UserID,
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
        WHEN n.Type = 'message' THEN (SELECT c.Subject FROM messages.Messages m JOIN messages.Conversations c ON m.ConversationID = c.ConversationID WHERE m.MessageID = n.RelatedID)
        ELSE NULL
    END AS Status
FROM notifications.Notifications n;
GO

PRINT 'View [notifications].[vw_UserNotifications] created successfully.';
GO
