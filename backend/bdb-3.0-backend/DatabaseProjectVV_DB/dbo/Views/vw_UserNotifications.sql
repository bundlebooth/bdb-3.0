
-- User notifications view
CREATE   VIEW vw_UserNotifications AS
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

