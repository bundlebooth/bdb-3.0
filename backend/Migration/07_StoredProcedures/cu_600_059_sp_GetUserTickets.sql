/*
    Migration Script: Create Stored Procedure [users.sp_GetTickets]
    Phase: 600 - Stored Procedures
    Script: cu_600_059_sp_GetUserTickets.sql
    Description: Creates the [users].[sp_GetTickets] stored procedure
    Schema: users
    Execution Order: 59
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetTickets]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetTickets]'))
    DROP PROCEDURE [users].[sp_GetTickets];
GO

-- Procedure to get user's tickets
CREATE PROCEDURE [users].[sp_GetTickets]
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
    FROM admin.SupportTickets t
    WHERE t.UserID = @UserID
    ORDER BY t.CreatedAt DESC;
END;
GO

PRINT 'Stored procedure [users].[sp_GetTickets] created successfully.';
GO

