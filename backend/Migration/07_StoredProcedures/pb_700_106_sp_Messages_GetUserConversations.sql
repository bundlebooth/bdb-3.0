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
    
    -- Use CTEs for better performance instead of correlated subqueries
    ;WITH LastMessages AS (
        SELECT 
            ConversationID,
            Content,
            CreatedAt,
            ROW_NUMBER() OVER (PARTITION BY ConversationID ORDER BY CreatedAt DESC) as rn
        FROM messages.Messages
    ),
    UnreadCounts AS (
        SELECT 
            ConversationID,
            COUNT(*) as UnreadCount
        FROM messages.Messages
        WHERE IsRead = 0 AND SenderID != @UserID
        GROUP BY ConversationID
    )
    SELECT 
        c.ConversationID,
        c.VendorProfileID,
        c.CreatedAt,
        c.UserID AS ConversationUserID,
        -- When user is client: show vendor business name
        -- When user is vendor: show client's name
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
        -- Vendor business info (always included for context)
        v.BusinessName AS VendorBusinessName,
        v.LogoURL AS VendorLogoURL,
        -- Vendor host (owner) info
        vu.FirstName AS VendorHostFirstName,
        vu.LastName AS VendorHostLastName,
        vu.ProfileImageURL AS VendorHostAvatar,
        -- Client info
        u.FirstName AS ClientFirstName,
        u.LastName AS ClientLastName,
        u.ProfileImageURL AS ClientAvatar,
        CASE 
            WHEN c.UserID = @UserID THEN 1
            ELSE 0
        END AS IsClientRole,
        CASE 
            WHEN v.UserID = @UserID THEN 1
            ELSE 0
        END AS IsVendorRole,
        lm.Content AS LastMessageContent,
        lm.CreatedAt AS LastMessageCreatedAt,
        ISNULL(uc.UnreadCount, 0) AS UnreadCount
    FROM messages.Conversations c
    LEFT JOIN users.Users u ON c.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
    LEFT JOIN users.Users vu ON v.UserID = vu.UserID
    LEFT JOIN LastMessages lm ON c.ConversationID = lm.ConversationID AND lm.rn = 1
    LEFT JOIN UnreadCounts uc ON c.ConversationID = uc.ConversationID
    WHERE c.UserID = @UserID
       OR c.VendorProfileID = @UserVendorProfileID
    ORDER BY COALESCE(lm.CreatedAt, c.CreatedAt) DESC;
END
GO




