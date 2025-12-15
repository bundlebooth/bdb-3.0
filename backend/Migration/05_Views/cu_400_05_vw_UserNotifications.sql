/*
    Migration Script: Create View [vw_UserNotifications]
    Phase: 400 - Views
    Script: cu_400_05_dbo.vw_UserNotifications.sql
    Description: Creates the [dbo].[vw_UserNotifications] view
    
    Execution Order: 5
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [dbo].[vw_UserNotifications]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_UserNotifications]'))
    DROP VIEW [dbo].[vw_UserNotifications];
GO

CREATE VIEW [dbo].[vw_UserNotifications] AS
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
        WHEN n.Type = 'booking' THEN (SELECT b.Status FROM Bookings b WHERE b.BookingID = n.RelatedID)
        WHEN n.Type = 'message' THEN (SELECT c.Subject FROM Messages m JOIN Conversations c ON m.ConversationID = c.ConversationID WHERE m.MessageID = n.RelatedID)
        ELSE NULL
    END AS Status
FROM Notifications n;
GO

PRINT 'View [dbo].[vw_UserNotifications] created successfully.';
GO
