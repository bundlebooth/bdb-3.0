-- =============================================
-- Stored Procedure: messages.sp_CheckExistingConversation
-- Description: Checks if a conversation exists between user and vendor
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_CheckExistingConversation]'))
    DROP PROCEDURE [messages].[sp_CheckExistingConversation];
GO

CREATE PROCEDURE [messages].[sp_CheckExistingConversation]
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 ConversationID 
    FROM messages.Conversations 
    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END
GO


