/*
    Migration Script: Create Stored Procedure [sp_GetSupportTickets]
    Phase: 600 - Stored Procedures
    Script: cu_600_048_dbo.sp_GetSupportTickets.sql
    Description: Creates the [admin].[sp_GetSupportTickets] stored procedure
    
    Execution Order: 48
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetSupportTickets]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetSupportTickets]'))
    DROP PROCEDURE [admin].[sp_GetSupportTickets];
GO

CREATE   PROCEDURE [admin].[sp_GetSupportTickets]
    @Status NVARCHAR(20) = NULL,
    @Priority NVARCHAR(20) = NULL,
    @Category NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL,
    @Page INT = 1,
    @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Page - 1) * @Limit;
    
    SELECT 
        t.TicketID,
        t.TicketNumber,
        t.UserID,
        t.UserEmail,
        t.UserName,
        t.Subject,
        t.Description,
        t.Category,
        t.Priority,
        t.Status,
        t.AssignedTo,
        a.Name AS AssignedToName,
        t.Source,
        t.ConversationID,
        t.CreatedAt,
        t.UpdatedAt,
        t.ResolvedAt,
        t.ClosedAt,
        (SELECT COUNT(*) FROM SupportTicketMessages WHERE TicketID = t.TicketID) AS MessageCount
    FROM admin.SupportTickets t
    LEFT JOIN users.Users a ON t.AssignedTo = a.UserID
    WHERE (@Status IS NULL OR t.Status = @Status)
        AND (@Priority IS NULL OR t.Priority = @Priority)
        AND (@Category IS NULL OR t.Category = @Category)
        AND (@Search IS NULL OR t.Subject LIKE '%' + @Search + '%' OR t.UserEmail LIKE '%' + @Search + '%' OR t.TicketNumber LIKE '%' + @Search + '%')
    ORDER BY 
        CASE t.Priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        t.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    
    SELECT COUNT(*) AS Total
    FROM admin.SupportTickets t
    WHERE (@Status IS NULL OR t.Status = @Status)
        AND (@Priority IS NULL OR t.Priority = @Priority)
        AND (@Category IS NULL OR t.Category = @Category)
        AND (@Search IS NULL OR t.Subject LIKE '%' + @Search + '%' OR t.UserEmail LIKE '%' + @Search + '%' OR t.TicketNumber LIKE '%' + @Search + '%');
END;
GO

PRINT 'Stored procedure [admin].[sp_GetSupportTickets] created successfully.';
GO


