-- =============================================
-- Stored Procedure: messages.sp_GetUserConversations
-- Description: Gets all conversations for a user
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_GetUserConversations]'))
    DROP PROCEDURE [messages].[sp_GetUserConversations];
GO

CREATE PROCEDURE [messages].[sp_GetUserConversations]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserVendorProfileID INT;
    SELECT @UserVendorProfileID = VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID;
    
    SELECT 
        c.ConversationID,
        c.VendorProfileID,
        c.CreatedAt,
        c.UserID AS ConversationUserID,
        CASE 
            WHEN c.UserID = @UserID THEN v.BusinessName 
            ELSE CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) 
        END AS OtherPartyName,
        CASE 
            WHEN c.UserID = @UserID THEN 'vendor'
            ELSE 'user'
        END AS OtherPartyType,
        CASE 
            WHEN c.UserID = @UserID THEN v.LogoURL
            ELSE u.ProfileImageURL
        END AS OtherPartyAvatar,
        CASE 
            WHEN c.UserID = @UserID THEN 1
            ELSE 0
        END AS IsClientRole,
        CASE 
            WHEN v.UserID = @UserID THEN 1
            ELSE 0
        END AS IsVendorRole,
        m.Content AS LastMessageContent,
        m.CreatedAt AS LastMessageCreatedAt,
        (SELECT COUNT(*) FROM messages.Messages WHERE ConversationID = c.ConversationID AND IsRead = 0 AND SenderID != @UserID) AS UnreadCount
    FROM messages.Conversations c
    LEFT JOIN users.Users u ON c.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
    LEFT JOIN messages.Messages m ON c.ConversationID = m.ConversationID
        AND m.MessageID = (
            SELECT TOP 1 MessageID 
            FROM messages.Messages 
            WHERE ConversationID = c.ConversationID 
            ORDER BY CreatedAt DESC
        )
    WHERE c.UserID = @UserID OR (v.UserID = @UserID AND @UserVendorProfileID IS NOT NULL)
    GROUP BY c.ConversationID, c.VendorProfileID, c.CreatedAt, c.UserID, u.FirstName, u.LastName, v.BusinessName, m.Content, m.CreatedAt, v.LogoURL, u.ProfileImageURL, v.UserID
    ORDER BY COALESCE(m.CreatedAt, c.CreatedAt) DESC;
END
GO




