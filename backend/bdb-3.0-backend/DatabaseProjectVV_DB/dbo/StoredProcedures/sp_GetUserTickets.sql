
-- 5. Create procedure to get user's tickets
CREATE   PROCEDURE sp_GetUserTickets
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        t.TicketID,
        t.TicketNumber,
        t.Subject,
        t.Description,
        t.Category,
        t.Priority,
        t.Status,
        t.CreatedAt,
        t.UpdatedAt,
        t.ResolvedAt,
        (SELECT COUNT(*) FROM SupportTicketMessages WHERE TicketID = t.TicketID) AS MessageCount
    FROM SupportTickets t
    WHERE t.UserID = @UserID
    ORDER BY t.CreatedAt DESC;
END;

GO

