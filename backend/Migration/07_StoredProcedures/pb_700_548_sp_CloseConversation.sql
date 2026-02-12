-- =============================================
-- Stored Procedure: messages.sp_CloseConversation
-- Description: Update conversation status when chat ends
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[messages].[sp_CloseConversation]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [messages].[sp_CloseConversation]
GO

CREATE PROCEDURE [messages].[sp_CloseConversation]
    @ConversationID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE messages.Conversations 
    SET UpdatedAt = GETDATE()
    WHERE ConversationID = @ConversationID
END
GO
