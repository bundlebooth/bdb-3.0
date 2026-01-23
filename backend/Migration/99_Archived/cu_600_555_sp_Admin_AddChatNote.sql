-- =============================================
-- Stored Procedure: admin.sp_AddChatNote
-- Description: Adds an admin note to a conversation (internal only)
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_AddChatNote]'))
    DROP PROCEDURE [admin].[sp_AddChatNote];
GO

CREATE PROCEDURE [admin].[sp_AddChatNote]
    @ConversationID INT,
    @Note NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert the admin note as a special message type
    INSERT INTO messages.Messages 
        (ConversationID, SenderID, SenderType, Content, IsSystem, IsAdminNote, SentAt, IsRead)
    VALUES 
        (@ConversationID, NULL, 'admin', @Note, 0, 1, GETDATE(), 1);
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END
GO

