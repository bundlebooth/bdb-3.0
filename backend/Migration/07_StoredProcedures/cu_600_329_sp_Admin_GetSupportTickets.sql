-- =============================================
-- Stored Procedure: admin.sp_GetSupportTickets
-- Description: Gets support tickets with filters
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetSupportTickets]'))
    DROP PROCEDURE [admin].[sp_GetSupportTickets];
GO

CREATE PROCEDURE [admin].[sp_GetSupportTickets]
    @Status NVARCHAR(50) = NULL,
    @Priority NVARCHAR(50) = NULL,
    @Category NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Check if SupportTickets table exists
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SupportTickets')
    BEGIN
        SELECT 
            t.TicketID as id,
            t.TicketNumber as ticketNumber,
            t.UserID as userId,
            t.UserEmail as userEmail,
            t.UserName as userName,
            t.Subject as subject,
            t.Description as description,
            t.Category as category,
            t.Priority as priority,
            t.Status as status,
            t.AssignedTo as assignedTo,
            a.Name as assignedToName,
            t.Source as source,
            t.ConversationID as conversationId,
            t.CreatedAt as createdAt,
            t.UpdatedAt as updatedAt,
            t.ResolvedAt as resolvedAt,
            (SELECT COUNT(*) FROM SupportTicketMessages WHERE TicketID = t.TicketID) as messageCount
        FROM admin.SupportTickets t
        LEFT JOIN users.Users a ON t.AssignedTo = a.UserID
        WHERE 
            (@Status IS NULL OR t.Status = @Status)
            AND (@Priority IS NULL OR t.Priority = @Priority)
            AND (@Category IS NULL OR t.Category = @Category)
            AND (@Search IS NULL OR t.Subject LIKE '%' + @Search + '%' OR t.UserEmail LIKE '%' + @Search + '%' OR t.TicketNumber LIKE '%' + @Search + '%')
        ORDER BY 
            CASE t.Priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
            t.CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
        
        SELECT COUNT(*) as total 
        FROM admin.SupportTickets t
        WHERE 
            (@Status IS NULL OR t.Status = @Status)
            AND (@Priority IS NULL OR t.Priority = @Priority)
            AND (@Category IS NULL OR t.Category = @Category)
            AND (@Search IS NULL OR t.Subject LIKE '%' + @Search + '%' OR t.UserEmail LIKE '%' + @Search + '%' OR t.TicketNumber LIKE '%' + @Search + '%');
    END
    ELSE
    BEGIN
        SELECT NULL as id WHERE 1=0;
        SELECT 0 as total;
    END
END
GO


