
-- Add ticket message
CREATE   PROCEDURE sp_AddTicketMessage
    @TicketID INT,
    @SenderID INT = NULL,
    @SenderType NVARCHAR(20),
    @Message NVARCHAR(MAX),
    @Attachments NVARCHAR(MAX) = NULL,
    @IsInternal BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SupportTicketMessages (TicketID, SenderID, SenderType, Message, Attachments, IsInternal)
    VALUES (@TicketID, @SenderID, @SenderType, @Message, @Attachments, @IsInternal);
    
    -- Update ticket timestamp
    UPDATE SupportTickets SET UpdatedAt = GETUTCDATE() WHERE TicketID = @TicketID;
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END;

GO

