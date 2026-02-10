-- =============================================
-- Stored Procedure: messages.sp_CreateSupportConversation
-- Description: Creates a new support conversation with welcome message
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_CreateSupportConversation]'))
    DROP PROCEDURE [messages].[sp_CreateSupportConversation];
GO

CREATE PROCEDURE [messages].[sp_CreateSupportConversation]
    @UserID INT,
    @Subject NVARCHAR(255) = 'Support Request'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ConversationID INT;
    DECLARE @AdminID INT;
    
    -- Get an admin user ID for the welcome message
    SELECT TOP 1 @AdminID = UserID FROM users.Users WHERE IsAdmin = 1;
    IF @AdminID IS NULL SET @AdminID = 1;
    
    -- Create the conversation with ConversationType = 'support'
    INSERT INTO messages.Conversations (UserID, VendorProfileID, Subject, ConversationType, CreatedAt, UpdatedAt)
    VALUES (@UserID, NULL, @Subject, 'support', GETDATE(), GETDATE());
    
    SET @ConversationID = SCOPE_IDENTITY();
    
    -- Add initial welcome message from support (Intercom-style greeting)
    INSERT INTO messages.Messages (ConversationID, SenderID, Content, IsRead, CreatedAt)
    VALUES (@ConversationID, @AdminID, '👋 Hi there! I''m here to help with any questions about Planbeau.

You can ask me about bookings, vendors, your account, or anything else. How can I help you today?', 0, GETDATE());
    
    SELECT @ConversationID AS ConversationID;
END
GO


