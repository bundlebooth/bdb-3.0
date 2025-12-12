
-- Get ticket messages
CREATE   PROCEDURE sp_GetTicketMessages
    @TicketID INT,
    @IncludeInternal BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.MessageID,
        m.TicketID,
        m.SenderID,
        u.Name AS SenderName,
        m.SenderType,
        m.Message,
        m.Attachments,
        m.IsInternal,
        m.CreatedAt
    FROM SupportTicketMessages m
    LEFT JOIN Users u ON m.SenderID = u.UserID
    WHERE m.TicketID = @TicketID
        AND (@IncludeInternal = 1 OR m.IsInternal = 0)
    ORDER BY m.CreatedAt ASC;
END;

GO

