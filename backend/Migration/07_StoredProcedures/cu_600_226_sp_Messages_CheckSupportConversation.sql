-- =============================================
-- Stored Procedure: sp_Messages_CheckSupportConversation
-- Description: Checks if user has an existing support conversation
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Messages_CheckSupportConversation]'))
    DROP PROCEDURE [dbo].[sp_Messages_CheckSupportConversation];
GO

CREATE PROCEDURE [dbo].[sp_Messages_CheckSupportConversation]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check for support conversation via SupportConversations table
    SELECT TOP 1 c.ConversationID 
    FROM Conversations c
    INNER JOIN SupportConversations sc ON c.ConversationID = sc.ConversationID
    WHERE c.UserID = @UserID
    ORDER BY c.CreatedAt DESC;
END
GO
