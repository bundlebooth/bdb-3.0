-- =============================================
-- Stored Procedure: messages.sp_CheckSupportConversation
-- Description: Checks if user has an existing support conversation
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_CheckSupportConversation]'))
    DROP PROCEDURE [messages].[sp_CheckSupportConversation];
GO

CREATE PROCEDURE [messages].[sp_CheckSupportConversation]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check for support conversation via SupportConversations table
    SELECT TOP 1 c.ConversationID 
    FROM messages.Conversations c
    INNER JOIN SupportConversations sc ON c.ConversationID = sc.ConversationID
    WHERE c.UserID = @UserID
    ORDER BY c.CreatedAt DESC;
END
GO


