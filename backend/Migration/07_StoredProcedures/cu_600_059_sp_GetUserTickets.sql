/*
    Migration Script: Create Stored Procedure [sp_GetUserTickets]
    Phase: 600 - Stored Procedures
    Script: cu_600_059_dbo.sp_GetUserTickets.sql
    Description: Creates the [dbo].[sp_GetUserTickets] stored procedure
    
    Execution Order: 59
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetUserTickets]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetUserTickets]'))
    DROP PROCEDURE [dbo].[sp_GetUserTickets];
GO

-- Procedure to get user's tickets
CREATE PROCEDURE [dbo].[sp_GetUserTickets]
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

PRINT 'Stored procedure [dbo].[sp_GetUserTickets] created successfully.';
GO
