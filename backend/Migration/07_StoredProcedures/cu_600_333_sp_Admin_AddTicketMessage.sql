-- =============================================
-- Stored Procedure: sp_Admin_AddTicketMessage
-- Description: Adds a message to a support ticket
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_AddTicketMessage]'))
    DROP PROCEDURE [dbo].[sp_Admin_AddTicketMessage];
GO

CREATE PROCEDURE [dbo].[sp_Admin_AddTicketMessage]
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
    
    UPDATE SupportTickets SET UpdatedAt = GETUTCDATE() WHERE TicketID = @TicketID;
END
GO
