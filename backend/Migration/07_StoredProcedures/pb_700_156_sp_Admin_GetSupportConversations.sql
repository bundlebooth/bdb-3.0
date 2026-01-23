-- =============================================
-- Stored Procedure: admin.sp_GetSupportConversations
-- Description: Gets all support conversations for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetSupportConversations]'))
    DROP PROCEDURE [admin].[sp_GetSupportConversations];
GO

CREATE PROCEDURE [admin].[sp_GetSupportConversations]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.ConversationID,
        c.UserID,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) as UserName,
        u.Email as UserEmail,
        c.CreatedAt,
        c.UpdatedAt,
        (SELECT TOP 1 Content FROM messages.Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC) as LastMessage,
        (SELECT COUNT(*) FROM messages.Messages WHERE ConversationID = c.ConversationID AND IsRead = 0 AND SenderID = c.UserID) as UnreadCount
    FROM messages.Conversations c
    INNER JOIN users.Users u ON c.UserID = u.UserID
    WHERE c.ConversationType = 'support'
    ORDER BY c.UpdatedAt DESC;
END
GO
