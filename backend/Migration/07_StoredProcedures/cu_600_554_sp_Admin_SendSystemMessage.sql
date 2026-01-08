-- =============================================
-- Stored Procedure: admin.sp_SendSystemMessage
-- Description: Sends a system message to a conversation
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_SendSystemMessage]'))
    DROP PROCEDURE [admin].[sp_SendSystemMessage];
GO

CREATE PROCEDURE [admin].[sp_SendSystemMessage]
    @ConversationID INT,
    @Message NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert the system message into Messages table
    INSERT INTO messages.Messages 
        (ConversationID, SenderID, SenderType, Content, IsSystem, SentAt, IsRead)
    VALUES 
        (@ConversationID, NULL, 'system', @Message, 1, GETDATE(), 0);
    
    -- Update conversation's last message timestamp
    UPDATE messages.Conversations
    SET LastMessageAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE ConversationID = @ConversationID;
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END
GO

