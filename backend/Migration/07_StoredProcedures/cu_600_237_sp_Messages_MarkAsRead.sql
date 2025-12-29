/*
    Migration Script: Create Stored Procedure [sp_MarkMessagesAsRead]
    Phase: 600 - Stored Procedures
    Script: cu_600_237_sp_Messages_MarkAsRead.sql
    Description: Marks messages as read and returns updated message IDs
    Schema: messages
    
    Execution Order: 237
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [messages].[sp_MarkMessagesAsRead]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_MarkMessagesAsRead]'))
    DROP PROCEDURE [messages].[sp_MarkMessagesAsRead];
GO

CREATE PROCEDURE [messages].[sp_MarkMessagesAsRead]
    @ConversationID INT,
    @ReaderUserID INT,
    @MessageIDs NVARCHAR(MAX) = NULL  -- Optional: specific message IDs to mark as read
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UpdatedMessages TABLE (MessageID INT);
    
    IF @MessageIDs IS NOT NULL
    BEGIN
        -- Mark specific messages as read
        UPDATE m
        SET m.IsRead = 1,
            m.ReadAt = GETDATE()
        OUTPUT INSERTED.MessageID INTO @UpdatedMessages
        FROM [messages].[Messages] m
        WHERE m.ConversationID = @ConversationID
        AND m.SenderID != @ReaderUserID
        AND m.IsRead = 0
        AND m.MessageID IN (
            SELECT CAST(value AS INT) 
            FROM STRING_SPLIT(@MessageIDs, ',')
            WHERE ISNUMERIC(value) = 1
        );
    END
    ELSE
    BEGIN
        -- Mark all unread messages in conversation as read
        UPDATE m
        SET m.IsRead = 1,
            m.ReadAt = GETDATE()
        OUTPUT INSERTED.MessageID INTO @UpdatedMessages
        FROM [messages].[Messages] m
        WHERE m.ConversationID = @ConversationID
        AND m.SenderID != @ReaderUserID
        AND m.IsRead = 0;
    END
    
    -- Return updated message IDs with read status
    SELECT 
        um.MessageID,
        m.IsRead,
        m.ReadAt,
        m.SenderID
    FROM @UpdatedMessages um
    JOIN [messages].[Messages] m ON um.MessageID = m.MessageID;
END;
GO

PRINT 'Stored procedure [messages].[sp_MarkMessagesAsRead] created successfully.';
GO
