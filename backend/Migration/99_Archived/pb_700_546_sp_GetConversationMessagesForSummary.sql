-- =============================================
-- Stored Procedure: messages.sp_GetConversationMessagesForSummary
-- Description: Get all messages from a conversation for chat summary email
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[messages].[sp_GetConversationMessagesForSummary]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [messages].[sp_GetConversationMessagesForSummary]
GO

CREATE PROCEDURE [messages].[sp_GetConversationMessagesForSummary]
    @ConversationID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.MessageID, 
        m.ConversationID, 
        m.SenderID, 
        m.SenderType, 
        m.Content, 
        m.CreatedAt,
        u.FirstName + ' ' + u.LastName AS SenderName
    FROM messages.Messages m
    LEFT JOIN users.Users u ON m.SenderID = u.UserID AND m.SenderType NOT IN ('support', 'guest')
    WHERE m.ConversationID = @ConversationID
    ORDER BY m.CreatedAt ASC
END
GO
