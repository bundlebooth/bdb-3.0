-- =============================================
-- Stored Procedure: admin.sp_GetSupportConversationMessages
-- Description: Gets messages for a support conversation and marks them as read
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetSupportConversationMessages]'))
    DROP PROCEDURE [admin].[sp_GetSupportConversationMessages];
GO

CREATE PROCEDURE [admin].[sp_GetSupportConversationMessages]
    @ConversationID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get messages
    SELECT 
        m.MessageID,
        m.ConversationID,
        m.SenderID,
        m.Content,
        m.CreatedAt,
        m.IsRead,
        u.Name as SenderName,
        CASE WHEN u.IsAdmin = 1 THEN 1 ELSE 0 END as IsFromSupport
    FROM messages.Messages m
    INNER JOIN users.Users u ON m.SenderID = u.UserID
    WHERE m.ConversationID = @ConversationID
    ORDER BY m.CreatedAt ASC;
    
    -- Mark messages as read
    UPDATE messages.Messages 
    SET IsRead = 1 
    WHERE ConversationID = @ConversationID AND IsRead = 0;
END
GO
