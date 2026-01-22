/*
    Migration Script: Create View [vw_VendorConversations]
    Phase: 400 - Views
    Script: cu_400_07_dbo.vw_VendorConversations.sql
    Description: Creates the [messages].[vw_VendorConversations] view
    
    Execution Order: 7
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [messages].[vw_VendorConversations]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[messages].[vw_VendorConversations]'))
    DROP VIEW [messages].[vw_VendorConversations];
GO

CREATE VIEW [messages].[vw_VendorConversations] AS
SELECT 
    c.ConversationID,
    c.VendorProfileID,
    c.UserID,
    CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS UserName,
    u.ProfileImageURL AS UserAvatar,
    c.BookingID,
    b.ServiceID,
    s.Name AS ServiceName,
    c.Subject,
    c.LastMessageAt,
    (SELECT COUNT(*) FROM messages.Messages m WHERE m.ConversationID = c.ConversationID AND m.IsRead = 0 AND m.SenderID = c.UserID) AS UnreadCount,
    (SELECT TOP 1 m.Content FROM messages.Messages m WHERE m.ConversationID = c.ConversationID ORDER BY m.CreatedAt DESC) AS LastMessagePreview
FROM messages.Conversations c
JOIN users.Users u ON c.UserID = u.UserID
LEFT JOIN bookings.Bookings b ON c.BookingID = b.BookingID
LEFT JOIN vendors.Services s ON b.ServiceID = s.ServiceID;
GO

PRINT 'View [messages].[vw_VendorConversations] created successfully.';
GO
