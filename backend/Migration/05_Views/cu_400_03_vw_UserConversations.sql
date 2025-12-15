/*
    Migration Script: Create View [vw_UserConversations]
    Phase: 400 - Views
    Script: cu_400_03_dbo.vw_UserConversations.sql
    Description: Creates the [dbo].[vw_UserConversations] view
    
    Execution Order: 3
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [dbo].[vw_UserConversations]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_UserConversations]'))
    DROP VIEW [dbo].[vw_UserConversations];
GO

CREATE VIEW [dbo].[vw_UserConversations] AS
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

PRINT 'View [dbo].[vw_UserConversations] created successfully.';
GO
