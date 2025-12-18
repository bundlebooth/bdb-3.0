/*
    Migration Script: Create Stored Procedure [sp_GetConversationMessages]
    Phase: 600 - Stored Procedures
    Script: cu_600_035_dbo.sp_GetConversationMessages.sql
    Description: Creates the [messages].[sp_GetConversationMessages] stored procedure
    
    Execution Order: 35
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [messages].[sp_GetConversationMessages]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_GetConversationMessages]'))
    DROP PROCEDURE [messages].[sp_GetConversationMessages];
GO

CREATE   PROCEDURE [messages].[sp_GetConversationMessages]
    @ConversationID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verify user has access to conversation
    IF EXISTS (
        SELECT 1 FROM messages.Conversations c
        WHERE c.ConversationID = @ConversationID
        AND (c.UserID = @UserID OR 
             (SELECT v.UserID FROM vendors.VendorProfiles v WHERE v.VendorProfileID = c.VendorProfileID) = @UserID)
    )
    BEGIN
        -- Get messages
        SELECT 
            m.MessageID,
            m.SenderID,
            u.Name AS SenderName,
            u.ProfileImageURL AS SenderAvatar,
            m.Content,
            m.IsRead,
            m.ReadAt,
            m.CreatedAt,
            (
                SELECT 
                    ma.AttachmentID,
                    ma.FileURL,
                    ma.FileType,
                    ma.FileSize,
                    ma.OriginalName
                FROM MessageAttachments ma
                WHERE ma.MessageID = m.MessageID
                FOR JSON PATH
            ) AS Attachments
        FROM messages.Messages m
        JOIN users.Users u ON m.SenderID = u.UserID
        WHERE m.ConversationID = @ConversationID
        ORDER BY m.CreatedAt;
        
        -- Mark messages as read if recipient
        UPDATE m
        SET m.IsRead = 1,
            m.ReadAt = GETDATE()
        FROM messages.Messages m
        JOIN messages.Conversations c ON m.ConversationID = c.ConversationID
        WHERE m.ConversationID = @ConversationID
        AND m.SenderID != @UserID
        AND m.IsRead = 0;
    END
    ELSE
    BEGIN
        -- Return empty result if no access
        SELECT TOP 0 NULL AS MessageID;
    END
END;

GO

PRINT 'Stored procedure [messages].[sp_GetConversationMessages] created successfully.';
GO




