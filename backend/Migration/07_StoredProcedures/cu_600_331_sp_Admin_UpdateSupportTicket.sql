-- =============================================
-- Stored Procedure: admin.sp_UpdateSupportTicket
-- Description: Updates a support ticket
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpdateSupportTicket]'))
    DROP PROCEDURE [admin].[sp_UpdateSupportTicket];
GO

CREATE PROCEDURE [admin].[sp_UpdateSupportTicket]
    @TicketID INT,
    @Status NVARCHAR(50) = NULL,
    @Priority NVARCHAR(50) = NULL,
    @AssignedTo INT = NULL,
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE admin.SupportTickets SET
        Status = ISNULL(@Status, Status),
        Priority = ISNULL(@Priority, Priority),
        AssignedTo = ISNULL(@AssignedTo, AssignedTo),
        Category = ISNULL(@Category, Category),
        UpdatedAt = GETUTCDATE(),
        ResolvedAt = CASE WHEN @Status = 'resolved' THEN GETUTCDATE() ELSE ResolvedAt END,
        ClosedAt = CASE WHEN @Status = 'closed' THEN GETUTCDATE() ELSE ClosedAt END
    WHERE TicketID = @TicketID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

