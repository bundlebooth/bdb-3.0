
-- User conversations view
CREATE   VIEW vw_UserConversations AS
SELECT 
    c.ConversationID,
    c.UserID,
    c.VendorProfileID,
    v.BusinessName AS VendorName,
    c.BookingID,
    b.ServiceID,
    s.Name AS ServiceName,
    c.Subject,
    c.LastMessageAt,
    (SELECT COUNT(*) FROM Messages m WHERE m.ConversationID = c.ConversationID AND m.IsRead = 0 AND m.SenderID != c.UserID) AS UnreadCount,
    (SELECT TOP 1 m.Content FROM Messages m WHERE m.ConversationID = c.ConversationID ORDER BY m.CreatedAt DESC) AS LastMessagePreview
FROM Conversations c
JOIN VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
LEFT JOIN Bookings b ON c.BookingID = b.BookingID
LEFT JOIN Services s ON b.ServiceID = s.ServiceID;

GO

