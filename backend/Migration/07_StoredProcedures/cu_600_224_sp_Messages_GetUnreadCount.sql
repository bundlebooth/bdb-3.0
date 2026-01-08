-- =============================================
-- Stored Procedure: messages.sp_GetUnreadCount
-- Description: Gets unread message count for a user
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_GetUnreadCount]'))
    DROP PROCEDURE [messages].[sp_GetUnreadCount];
GO

CREATE PROCEDURE [messages].[sp_GetUnreadCount]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS UnreadCount
    FROM messages.Messages m
    JOIN messages.Conversations c ON m.ConversationID = c.ConversationID
    LEFT JOIN vendors.VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
    WHERE m.IsRead = 0 
    AND m.SenderID != @UserID
    AND (c.UserID = @UserID OR vp.UserID = @UserID);
END
GO



