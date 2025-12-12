

    
-- Get conversation messages
CREATE   PROCEDURE sp_GetConversationMessages
    @ConversationID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verify user has access to conversation
    IF EXISTS (
        SELECT 1 FROM Conversations c
        WHERE c.ConversationID = @ConversationID
        AND (c.UserID = @UserID OR 
             (SELECT v.UserID FROM VendorProfiles v WHERE v.VendorProfileID = c.VendorProfileID) = @UserID)
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
        FROM Messages m
        JOIN Users u ON m.SenderID = u.UserID
        WHERE m.ConversationID = @ConversationID
        ORDER BY m.CreatedAt;
        
        -- Mark messages as read if recipient
        UPDATE m
        SET m.IsRead = 1,
            m.ReadAt = GETDATE()
        FROM Messages m
        JOIN Conversations c ON m.ConversationID = c.ConversationID
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

