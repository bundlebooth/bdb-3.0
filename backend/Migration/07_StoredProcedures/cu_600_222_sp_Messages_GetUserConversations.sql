-- =============================================
-- Stored Procedure: sp_Messages_GetUserConversations
-- Description: Gets all conversations for a user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Messages_GetUserConversations]'))
    DROP PROCEDURE [dbo].[sp_Messages_GetUserConversations];
GO

CREATE PROCEDURE [dbo].[sp_Messages_GetUserConversations]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserVendorProfileID INT;
    SELECT @UserVendorProfileID = VendorProfileID FROM VendorProfiles WHERE UserID = @UserID;
    
    SELECT 
        c.ConversationID,
        c.VendorProfileID,
        c.CreatedAt,
        c.UserID AS ConversationUserID,
        CASE 
            WHEN c.UserID = @UserID THEN v.BusinessName 
            ELSE u.Name 
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
        (SELECT COUNT(*) FROM Messages WHERE ConversationID = c.ConversationID AND IsRead = 0 AND SenderID != @UserID) AS UnreadCount
    FROM Conversations c
    LEFT JOIN Users u ON c.UserID = u.UserID
    LEFT JOIN VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
    LEFT JOIN Messages m ON c.ConversationID = m.ConversationID
        AND m.MessageID = (
            SELECT TOP 1 MessageID 
            FROM Messages 
            WHERE ConversationID = c.ConversationID 
            ORDER BY CreatedAt DESC
        )
    WHERE c.UserID = @UserID OR (v.UserID = @UserID AND @UserVendorProfileID IS NOT NULL)
    GROUP BY c.ConversationID, c.VendorProfileID, c.CreatedAt, c.UserID, u.Name, v.BusinessName, m.Content, m.CreatedAt, v.LogoURL, u.ProfileImageURL, v.UserID
    ORDER BY COALESCE(m.CreatedAt, c.CreatedAt) DESC;
END
GO
