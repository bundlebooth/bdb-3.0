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
    DECLARE @TicketID INT;
    
    -- Create the conversation (without ConversationType - use SupportConversations table instead)
    INSERT INTO messages.Conversations (UserID, VendorProfileID, Subject, CreatedAt, UpdatedAt)
    VALUES (@UserID, 1, @Subject, GETDATE(), GETDATE());
    
    SET @ConversationID = SCOPE_IDENTITY();
    
    -- Generate a ticket ID (simple incrementing number)
    SELECT @TicketID = ISNULL(MAX(TicketID), 0) + 1 FROM SupportConversations;
    
    -- Link to SupportConversations table
    INSERT INTO SupportConversations (TicketID, ConversationID, CreatedAt)
    VALUES (@TicketID, @ConversationID, GETDATE());
    
    -- Add initial welcome message from support
    INSERT INTO messages.Messages (ConversationID, SenderID, Content, IsRead, CreatedAt)
    VALUES (@ConversationID, 1, 'Hello! Welcome to VenueVue Support. How can we help you today?', 0, GETDATE());
    
    SELECT @ConversationID AS ConversationID;
END
GO


