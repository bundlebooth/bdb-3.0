-- ============================================================
-- Get User Support Tickets
-- ============================================================
IF OBJECT_ID('admin.sp_GetUserSupportTickets', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_GetUserSupportTickets;
GO

CREATE PROCEDURE admin.sp_GetUserSupportTickets
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TicketID, TicketNumber, Subject, Description, Category, Priority, Status, 
           CreatedAt, UpdatedAt, ResolvedAt, Resolution, Attachments
    FROM admin.SupportTickets 
    WHERE UserID = @UserID 
    ORDER BY CreatedAt DESC;
END
GO
