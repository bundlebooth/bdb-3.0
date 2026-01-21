-- =============================================
-- Stored Procedure: admin.sp_SendSupportReply
-- Description: Sends a reply to a support conversation from admin
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_SendSupportReply]'))
    DROP PROCEDURE [admin].[sp_SendSupportReply];
GO

CREATE PROCEDURE [admin].[sp_SendSupportReply]
    @ConversationID INT,
    @SenderID INT,
    @Content NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @MessageID INT;
    
    -- Insert the message
    INSERT INTO messages.Messages (ConversationID, SenderID, Content, CreatedAt, IsRead)
    VALUES (@ConversationID, @SenderID, @Content, GETDATE(), 0);
    
    SET @MessageID = SCOPE_IDENTITY();
    
    -- Update conversation timestamp
    UPDATE messages.Conversations SET UpdatedAt = GETDATE() WHERE ConversationID = @ConversationID;
    
    -- Return message ID and user info for notification
    SELECT 
        @MessageID as MessageID,
        u.UserID,
        u.Email,
        u.Name
    FROM messages.Conversations c
    INNER JOIN users.Users u ON c.UserID = u.UserID
    WHERE c.ConversationID = @ConversationID;
END
GO
