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
    
    INSERT INTO messages.Messages (ConversationID, SenderID, Content, CreatedAt, IsRead)
    VALUES (@ConversationID, 0, '[SYSTEM] ' + @Message, GETDATE(), 0);
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END
GO

