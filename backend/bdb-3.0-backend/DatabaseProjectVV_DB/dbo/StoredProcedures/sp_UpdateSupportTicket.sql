
-- Update support ticket
CREATE   PROCEDURE sp_UpdateSupportTicket
    @TicketID INT,
    @Status NVARCHAR(20) = NULL,
    @Priority NVARCHAR(20) = NULL,
    @AssignedTo INT = NULL,
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE SupportTickets
    SET Status = ISNULL(@Status, Status),
        Priority = ISNULL(@Priority, Priority),
        AssignedTo = ISNULL(@AssignedTo, AssignedTo),
        Category = ISNULL(@Category, Category),
        UpdatedAt = GETUTCDATE(),
        ResolvedAt = CASE WHEN @Status = 'resolved' THEN GETUTCDATE() ELSE ResolvedAt END,
        ClosedAt = CASE WHEN @Status = 'closed' THEN GETUTCDATE() ELSE ClosedAt END
    WHERE TicketID = @TicketID;
    
    SELECT TicketID FROM SupportTickets WHERE TicketID = @TicketID;
END;

GO

