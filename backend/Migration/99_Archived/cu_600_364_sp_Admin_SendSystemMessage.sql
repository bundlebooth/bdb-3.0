-- Send a system message to a conversation
CREATE OR ALTER PROCEDURE admin.sp_SendSystemMessage
    @ConversationID INT,
    @Message NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert the system message
    INSERT INTO messages.Messages (
        ConversationID,
        SenderID,
        Content,
        IsRead,
        CreatedAt
    )
    VALUES (
        @ConversationID,
        0, -- System messages use SenderID 0
        '[SYSTEM] ' + @Message,
        0,
        GETDATE()
    );
    
    -- Update conversation's last message timestamp
    UPDATE messages.Conversations
    SET LastMessageAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE ConversationID = @ConversationID;
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END
GO
