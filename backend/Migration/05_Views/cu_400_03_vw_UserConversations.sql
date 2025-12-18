/*
    Migration Script: Create View [vw_UserConversations]
    Phase: 400 - Views
    Script: cu_400_03_dbo.vw_UserConversations.sql
    Description: Creates the [messages].[vw_UserConversations] view
    
    Execution Order: 3
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [messages].[vw_UserConversations]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[messages].[vw_UserConversations]'))
    DROP VIEW [messages].[vw_UserConversations];
GO

CREATE VIEW [messages].[vw_UserConversations] AS
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
    (SELECT COUNT(*) FROM messages.Messages m WHERE m.ConversationID = c.ConversationID AND m.IsRead = 0 AND m.SenderID != c.UserID) AS UnreadCount,
    (SELECT TOP 1 m.Content FROM messages.Messages m WHERE m.ConversationID = c.ConversationID ORDER BY m.CreatedAt DESC) AS LastMessagePreview
FROM messages.Conversations c
JOIN vendors.VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
LEFT JOIN bookings.Bookings b ON c.BookingID = b.BookingID
LEFT JOIN vendors.Services s ON b.ServiceID = s.ServiceID;
GO

PRINT 'View [messages].[vw_UserConversations] created successfully.';
GO
