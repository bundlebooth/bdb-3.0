-- =============================================
-- Messages - Get Read Status
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('messages.sp_GetReadStatus', 'P') IS NOT NULL
    DROP PROCEDURE messages.sp_GetReadStatus;
GO

CREATE PROCEDURE messages.sp_GetReadStatus
    @ConversationID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        MessageID,
        SenderID,
        IsRead,
        ReadAt
    FROM messages.Messages
    WHERE ConversationID = @ConversationID
    ORDER BY CreatedAt;
END
GO
