/*
    Migration Script: Create Stored Procedure [sp_UpdateSupportTicket]
    Phase: 600 - Stored Procedures
    Script: cu_600_099_dbo.sp_UpdateSupportTicket.sql
    Description: Creates the [admin].[sp_UpdateSupportTicket] stored procedure
    
    Execution Order: 99
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_UpdateSupportTicket]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpdateSupportTicket]'))
    DROP PROCEDURE [admin].[sp_UpdateSupportTicket];
GO

CREATE   PROCEDURE [admin].[sp_UpdateSupportTicket]
    @TicketID INT,
    @Status NVARCHAR(20) = NULL,
    @Priority NVARCHAR(20) = NULL,
    @AssignedTo INT = NULL,
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE admin.SupportTickets
    SET Status = ISNULL(@Status, Status),
        Priority = ISNULL(@Priority, Priority),
        AssignedTo = ISNULL(@AssignedTo, AssignedTo),
        Category = ISNULL(@Category, Category),
        UpdatedAt = GETUTCDATE(),
        ResolvedAt = CASE WHEN @Status = 'resolved' THEN GETUTCDATE() ELSE ResolvedAt END,
        ClosedAt = CASE WHEN @Status = 'closed' THEN GETUTCDATE() ELSE ClosedAt END
    WHERE TicketID = @TicketID;
    
    SELECT TicketID FROM admin.SupportTickets WHERE TicketID = @TicketID;
END;
GO

PRINT 'Stored procedure [admin].[sp_UpdateSupportTicket] created successfully.';
GO

