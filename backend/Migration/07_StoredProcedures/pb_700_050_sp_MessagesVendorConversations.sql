/*
    Migration Script: Create Stored Procedure for Vendor Conversations
    Phase: 600 - Stored Procedures
    Script: cu_600_081_sp_MessagesVendorConversations.sql
    Description: Creates stored procedure for getting vendor conversations
    Schema: messages
    Execution Order: 81
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [messages].[sp_GetVendorConversations]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_GetVendorConversations]'))
    DROP PROCEDURE [messages].[sp_GetVendorConversations];
GO

CREATE PROCEDURE [messages].[sp_GetVendorConversations]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.ConversationID,
        c.CreatedAt,
        u.UserID,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS UserName,
        u.Email AS UserEmail,
        u.ProfileImageURL AS UserProfilePic,
        ISNULL(m.Content, '') AS LastMessageContent,
        ISNULL(m.CreatedAt, c.CreatedAt) AS LastMessageCreatedAt,
        ISNULL(m.SenderID, 0) AS LastMessageSenderID,
        ISNULL(COUNT(CASE WHEN m2.IsRead = 0 AND m2.SenderID != vp.UserID THEN 1 END), 0) AS UnreadCount
    FROM Conversations c
    INNER JOIN vendors.VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
    INNER JOIN users.Users u ON c.UserID = u.UserID
    LEFT JOIN Messages m ON c.ConversationID = m.ConversationID
        AND m.MessageID = (
            SELECT TOP 1 MessageID 
            FROM Messages 
            WHERE ConversationID = c.ConversationID 
            ORDER BY CreatedAt DESC
        )
    LEFT JOIN Messages m2 ON c.ConversationID = m2.ConversationID
    WHERE c.VendorProfileID = @VendorProfileID
    GROUP BY c.ConversationID, c.CreatedAt, u.UserID, u.FirstName, u.LastName, u.Email, u.ProfileImageURL, m.Content, m.CreatedAt, m.SenderID, vp.UserID
    ORDER BY ISNULL(m.CreatedAt, c.CreatedAt) DESC;
END
GO

PRINT 'Stored procedure [messages].[sp_GetVendorConversations] created successfully.';
GO
