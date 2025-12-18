-- =============================================
-- Stored Procedure: admin.sp_AddTicketMessage
-- Description: Adds a message to a support ticket
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_AddTicketMessage]'))
    DROP PROCEDURE [admin].[sp_AddTicketMessage];
GO

CREATE PROCEDURE [admin].[sp_AddTicketMessage]
    @TicketID INT,
    @SenderID INT,
    @SenderType NVARCHAR(50) = 'admin',
    @Message NVARCHAR(MAX),
    @Attachments NVARCHAR(MAX) = NULL,
    @IsInternal BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SupportTicketMessages (TicketID, SenderID, SenderType, Message, Attachments, IsInternal)
    OUTPUT INSERTED.MessageID
    VALUES (@TicketID, @SenderID, @SenderType, @Message, @Attachments, @IsInternal);
    
    UPDATE admin.SupportTickets SET UpdatedAt = GETUTCDATE() WHERE TicketID = @TicketID;
END
GO

