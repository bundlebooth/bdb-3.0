-- =============================================
-- Stored Procedure: sp_SendGuestMessage
-- Description: Sends a message from a guest user in a support conversation
-- =============================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_SendGuestMessage' AND schema_id = SCHEMA_ID('messages'))
    DROP PROCEDURE messages.sp_SendGuestMessage
GO

CREATE PROCEDURE messages.sp_SendGuestMessage
    @ConversationID INT = NULL,
    @ReferenceNumber NVARCHAR(50) = NULL,
    @GuestEmail NVARCHAR(255) = NULL,
    @Content NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ActualConversationID INT;
    DECLARE @MessageID INT;
    
    -- Find conversation by ID or reference number
    IF @ConversationID IS NOT NULL
    BEGIN
        SET @ActualConversationID = @ConversationID;
    END
    ELSE IF @ReferenceNumber IS NOT NULL
    BEGIN
        SELECT @ActualConversationID = ConversationID 
        FROM messages.Conversations 
        WHERE ReferenceNumber = @ReferenceNumber;
    END
    
    IF @ActualConversationID IS NULL
    BEGIN
        RAISERROR('Conversation not found', 16, 1);
        RETURN;
    END
    
    -- Insert the message
    INSERT INTO messages.Messages (
        ConversationID,
        SenderID,
        SenderType,
        Content,
        CreatedAt,
        IsRead
    )
    VALUES (
        @ActualConversationID,
        NULL, -- Guest sender (no user ID)
        'guest',
        @Content,
        GETDATE(),
        0
    );
    
    SET @MessageID = SCOPE_IDENTITY();
    
    -- Update conversation timestamp
    UPDATE messages.Conversations
    SET UpdatedAt = GETDATE()
    WHERE ConversationID = @ActualConversationID;
    
    -- Return the message ID
    SELECT @MessageID AS MessageID;
END
GO
