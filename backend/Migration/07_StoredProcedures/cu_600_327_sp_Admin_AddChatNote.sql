-- =============================================
-- Stored Procedure: sp_Admin_AddChatNote
-- Description: Adds an admin note to a conversation
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_AddChatNote]'))
    DROP PROCEDURE [dbo].[sp_Admin_AddChatNote];
GO

CREATE PROCEDURE [dbo].[sp_Admin_AddChatNote]
    @ConversationID INT,
    @Note NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Messages (ConversationID, SenderID, Content, CreatedAt, IsRead)
    VALUES (@ConversationID, 0, '[ADMIN NOTE] ' + @Note, GETDATE(), 1);
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END
GO
