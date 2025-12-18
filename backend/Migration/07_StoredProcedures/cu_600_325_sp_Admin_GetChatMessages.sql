-- =============================================
-- Stored Procedure: sp_Admin_GetChatMessages
-- Description: Gets all messages for a specific conversation
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetChatMessages]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetChatMessages];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetChatMessages]
    @ConversationID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get conversation details
    SELECT 
        c.ConversationID,
        c.UserID,
        c.VendorProfileID,
        c.Subject,
        c.CreatedAt,
        u.Name as ClientName,
        u.Email as ClientEmail,
        vp.BusinessName as VendorName,
        vu.Email as VendorEmail
    FROM Conversations c
    LEFT JOIN Users u ON c.UserID = u.UserID
    LEFT JOIN VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
    LEFT JOIN Users vu ON vp.UserID = vu.UserID
    WHERE c.ConversationID = @ConversationID;
    
    -- Get messages
    SELECT 
        m.MessageID,
        m.ConversationID,
        m.SenderID,
        m.Content,
        m.IsRead,
        m.CreatedAt,
        u.Name as SenderName,
        u.Email as SenderEmail,
        CASE WHEN m.SenderID = c.UserID THEN 'client' ELSE 'vendor' END as SenderType
    FROM Messages m
    JOIN Conversations c ON m.ConversationID = c.ConversationID
    LEFT JOIN Users u ON m.SenderID = u.UserID
    WHERE m.ConversationID = @ConversationID
    ORDER BY m.CreatedAt ASC;
END
GO
