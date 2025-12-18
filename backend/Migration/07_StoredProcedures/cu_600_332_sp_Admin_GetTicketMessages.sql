-- =============================================
-- Stored Procedure: sp_Admin_GetTicketMessages
-- Description: Gets messages for a support ticket
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetTicketMessages]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetTicketMessages];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetTicketMessages]
    @TicketID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.MessageID as id,
        m.TicketID as ticketId,
        m.SenderID as senderId,
        u.Name as senderName,
        m.SenderType as senderType,
        m.Message as message,
        m.Attachments as attachments,
        m.IsInternal as isInternal,
        m.CreatedAt as createdAt
    FROM SupportTicketMessages m
    LEFT JOIN Users u ON m.SenderID = u.UserID
    WHERE m.TicketID = @TicketID
    ORDER BY m.CreatedAt ASC;
END
GO
