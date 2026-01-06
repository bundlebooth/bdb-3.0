-- =============================================
-- Stored Procedure: messages.sp_GetUserConversations
-- Description: Gets all conversations for a user (as client only, not as vendor)
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- Note: This returns conversations where the user is the CLIENT (initiator).
--       Vendor conversations are retrieved via sp_GetVendorConversations.
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_GetUserConversations]'))
    DROP PROCEDURE [messages].[sp_GetUserConversations];
GO

CREATE PROCEDURE [messages].[sp_GetUserConversations]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only return conversations where this user is the CLIENT (c.UserID = @UserID)
    -- Vendor conversations are handled separately by sp_GetVendorConversations
    SELECT 
        c.ConversationID,
        c.VendorProfileID,
        c.CreatedAt,
        c.UserID AS ConversationUserID,
        v.BusinessName AS OtherPartyName,
        'vendor' AS OtherPartyType,
        v.LogoURL AS OtherPartyAvatar,
        1 AS IsClientRole,
        0 AS IsVendorRole,
        m.Content AS LastMessageContent,
        m.CreatedAt AS LastMessageCreatedAt,
        (SELECT COUNT(*) FROM messages.Messages WHERE ConversationID = c.ConversationID AND IsRead = 0 AND SenderID != @UserID) AS UnreadCount
    FROM messages.Conversations c
    LEFT JOIN vendors.VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
    LEFT JOIN messages.Messages m ON c.ConversationID = m.ConversationID
        AND m.MessageID = (
            SELECT TOP 1 MessageID 
            FROM messages.Messages 
            WHERE ConversationID = c.ConversationID 
            ORDER BY CreatedAt DESC
        )
    WHERE c.UserID = @UserID
    ORDER BY COALESCE(m.CreatedAt, c.CreatedAt) DESC;
END
GO




