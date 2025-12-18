-- =============================================
-- Stored Procedure: sp_Messages_CreateSupportConversation
-- Description: Creates a new support conversation with welcome message
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Messages_CreateSupportConversation]'))
    DROP PROCEDURE [dbo].[sp_Messages_CreateSupportConversation];
GO

CREATE PROCEDURE [dbo].[sp_Messages_CreateSupportConversation]
    @UserID INT,
    @Subject NVARCHAR(255) = 'Support Request'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ConversationID INT;
    DECLARE @TicketID INT;
    
    -- Create the conversation (without ConversationType - use SupportConversations table instead)
    INSERT INTO Conversations (UserID, VendorProfileID, Subject, CreatedAt, UpdatedAt)
    VALUES (@UserID, 1, @Subject, GETDATE(), GETDATE());
    
    SET @ConversationID = SCOPE_IDENTITY();
    
    -- Generate a ticket ID (simple incrementing number)
    SELECT @TicketID = ISNULL(MAX(TicketID), 0) + 1 FROM SupportConversations;
    
    -- Link to SupportConversations table
    INSERT INTO SupportConversations (TicketID, ConversationID, CreatedAt)
    VALUES (@TicketID, @ConversationID, GETDATE());
    
    -- Add initial welcome message from support
    INSERT INTO Messages (ConversationID, SenderID, Content, IsRead, CreatedAt)
    VALUES (@ConversationID, 1, 'Hello! Welcome to VenueVue Support. How can we help you today?', 0, GETDATE());
    
    SELECT @ConversationID AS ConversationID;
END
GO
