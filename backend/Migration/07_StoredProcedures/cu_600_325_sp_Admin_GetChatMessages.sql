-- =============================================
-- Stored Procedure: admin.sp_GetChatMessages
-- Description: Gets all messages for a specific conversation
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetChatMessages]'))
    DROP PROCEDURE [admin].[sp_GetChatMessages];
GO

CREATE PROCEDURE [admin].[sp_GetChatMessages]
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
    FROM messages.Conversations c
    LEFT JOIN users.Users u ON c.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
    LEFT JOIN users.Users vu ON vp.UserID = vu.UserID
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
    FROM messages.Messages m
    JOIN messages.Conversations c ON m.ConversationID = c.ConversationID
    LEFT JOIN users.Users u ON m.SenderID = u.UserID
    WHERE m.ConversationID = @ConversationID
    ORDER BY m.CreatedAt ASC;
END
GO




