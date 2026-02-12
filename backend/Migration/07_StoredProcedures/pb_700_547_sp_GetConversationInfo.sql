-- =============================================
-- Stored Procedure: messages.sp_GetConversationInfo
-- Description: Get conversation info for chat end/summary
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[messages].[sp_GetConversationInfo]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [messages].[sp_GetConversationInfo]
GO

CREATE PROCEDURE [messages].[sp_GetConversationInfo]
    @ConversationID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.Subject, 
        c.Category, 
        c.GuestName, 
        c.GuestEmail, 
        c.ReferenceNumber, 
        c.UserID,
        u.Email AS UserEmail, 
        u.FirstName + ' ' + u.LastName AS UserName
    FROM messages.Conversations c
    LEFT JOIN users.Users u ON c.UserID = u.UserID
    WHERE c.ConversationID = @ConversationID
END
GO
