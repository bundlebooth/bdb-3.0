-- =============================================
-- Stored Procedure: admin.sp_GetSupportTickets
-- Description: Gets all support tickets with filters for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

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
    
    -- Main query - get tickets from admin.SupportTickets table
    SELECT 
        t.TicketID,
        t.TicketNumber,
        t.UserID,
        t.Subject,
        t.Description,
        t.Category,
        t.Priority,
        t.Status,
        t.AssignedTo,
        t.Source,
        t.CreatedAt,
        t.UpdatedAt,
        t.ResolvedAt,
        t.ClosedAt,
        ISNULL(t.UserName, CONCAT(u.FirstName, ' ', ISNULL(u.LastName, ''))) as UserName,
        ISNULL(t.UserEmail, u.Email) as UserEmail,
        (SELECT COUNT(*) FROM admin.SupportTicketMessages tm WHERE tm.TicketID = t.TicketID) as MessageCount
    FROM admin.SupportTickets t
    LEFT JOIN users.Users u ON t.UserID = u.UserID
    WHERE 
        (@Status IS NULL OR t.Status = @Status)
        AND (@Priority IS NULL OR t.Priority = @Priority)
        AND (@Category IS NULL OR t.Category = @Category)
        AND (@Search IS NULL OR t.Subject LIKE '%' + @Search + '%' OR t.Description LIKE '%' + @Search + '%' OR u.Email LIKE '%' + @Search + '%')
    ORDER BY 
        CASE t.Priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
        END,
        t.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Count query
    SELECT COUNT(*) as total
    FROM admin.SupportTickets t
    LEFT JOIN users.Users u ON t.UserID = u.UserID
    WHERE 
        (@Status IS NULL OR t.Status = @Status)
        AND (@Priority IS NULL OR t.Priority = @Priority)
        AND (@Category IS NULL OR t.Category = @Category)
        AND (@Search IS NULL OR t.Subject LIKE '%' + @Search + '%' OR t.Description LIKE '%' + @Search + '%' OR u.Email LIKE '%' + @Search + '%');
END
GO
