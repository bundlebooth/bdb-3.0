-- ============================================================
-- Get Support Ticket By ID
-- ============================================================
IF OBJECT_ID('admin.sp_GetSupportTicketById', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_GetSupportTicketById;
GO

CREATE PROCEDURE admin.sp_GetSupportTicketById
    @TicketID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TicketID, TicketNumber, Subject, Description, Category, Priority, Status, 
           CreatedAt, UpdatedAt, ResolvedAt, Resolution, Attachments, UserID, UserEmail, UserName
    FROM admin.SupportTickets 
    WHERE TicketID = @TicketID;
END
GO
