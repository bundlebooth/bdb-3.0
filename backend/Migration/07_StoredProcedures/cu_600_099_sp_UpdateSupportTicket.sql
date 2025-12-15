/*
    Migration Script: Create Stored Procedure [sp_UpdateSupportTicket]
    Phase: 600 - Stored Procedures
    Script: cu_600_099_dbo.sp_UpdateSupportTicket.sql
    Description: Creates the [dbo].[sp_UpdateSupportTicket] stored procedure
    
    Execution Order: 99
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateSupportTicket]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateSupportTicket]'))
    DROP PROCEDURE [dbo].[sp_UpdateSupportTicket];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateSupportTicket]
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

PRINT 'Stored procedure [dbo].[sp_UpdateSupportTicket] created successfully.';
GO
