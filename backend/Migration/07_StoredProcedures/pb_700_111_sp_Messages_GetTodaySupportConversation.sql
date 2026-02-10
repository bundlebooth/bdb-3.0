-- =============================================
-- Stored Procedure: messages.sp_GetTodaySupportConversation
-- Description: Gets user's support conversation from today (for daily reset behavior)
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_GetTodaySupportConversation]'))
    DROP PROCEDURE [messages].[sp_GetTodaySupportConversation];
GO

CREATE PROCEDURE [messages].[sp_GetTodaySupportConversation]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get support conversation created TODAY for this user
    SELECT TOP 1 c.ConversationID 
    FROM messages.Conversations c
    WHERE c.UserID = @UserID 
      AND c.ConversationType = 'support'
      AND CAST(c.CreatedAt AS DATE) = CAST(GETDATE() AS DATE)
    ORDER BY c.CreatedAt DESC;
END
GO


