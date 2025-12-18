-- =============================================
-- Stored Procedure: sp_Admin_UpdateSupportTicket
-- Description: Updates a support ticket
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_UpdateSupportTicket]'))
    DROP PROCEDURE [dbo].[sp_Admin_UpdateSupportTicket];
GO

CREATE PROCEDURE [dbo].[sp_Admin_UpdateSupportTicket]
    @TicketID INT,
    @Status NVARCHAR(50) = NULL,
    @Priority NVARCHAR(50) = NULL,
    @AssignedTo INT = NULL,
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE SupportTickets SET
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
