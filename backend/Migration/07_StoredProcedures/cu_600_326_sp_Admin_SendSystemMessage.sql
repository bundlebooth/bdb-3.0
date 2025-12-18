-- =============================================
-- Stored Procedure: sp_Admin_SendSystemMessage
-- Description: Sends a system message to a conversation
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_SendSystemMessage]'))
    DROP PROCEDURE [dbo].[sp_Admin_SendSystemMessage];
GO

CREATE PROCEDURE [dbo].[sp_Admin_SendSystemMessage]
    @ConversationID INT,
    @Message NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Messages (ConversationID, SenderID, Content, CreatedAt, IsRead)
    VALUES (@ConversationID, 0, '[SYSTEM] ' + @Message, GETDATE(), 0);
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END
GO
