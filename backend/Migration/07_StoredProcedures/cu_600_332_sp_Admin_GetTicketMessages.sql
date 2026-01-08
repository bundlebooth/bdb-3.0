-- =============================================
-- Stored Procedure: admin.sp_GetTicketMessages
-- Description: Gets messages for a support ticket
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetTicketMessages]'))
    DROP PROCEDURE [admin].[sp_GetTicketMessages];
GO

CREATE PROCEDURE [admin].[sp_GetTicketMessages]
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
    LEFT JOIN users.Users u ON m.SenderID = u.UserID
    WHERE m.TicketID = @TicketID
    ORDER BY m.CreatedAt ASC;
END
GO

