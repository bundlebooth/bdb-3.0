-- =============================================
-- Stored Procedure: sp_Messages_GetUnreadCount
-- Description: Gets unread message count for a user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Messages_GetUnreadCount]'))
    DROP PROCEDURE [dbo].[sp_Messages_GetUnreadCount];
GO

CREATE PROCEDURE [dbo].[sp_Messages_GetUnreadCount]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS UnreadCount
    FROM Messages m
    JOIN Conversations c ON m.ConversationID = c.ConversationID
    LEFT JOIN VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
    WHERE m.IsRead = 0 
    AND m.SenderID != @UserID
    AND (c.UserID = @UserID OR vp.UserID = @UserID);
END
GO
