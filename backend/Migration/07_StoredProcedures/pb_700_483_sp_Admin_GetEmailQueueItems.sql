/*
    Stored Procedure: admin.sp_GetEmailQueueItems
    Description: Gets email queue items for admin view with pagination
*/
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_GetEmailQueueItems'))
    DROP PROCEDURE admin.sp_GetEmailQueueItems
GO

CREATE PROCEDURE admin.sp_GetEmailQueueItems
    @Status NVARCHAR(20) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        eq.QueueID,
        eq.TemplateKey,
        et.TemplateName,
        eq.RecipientEmail,
        eq.RecipientName,
        eq.ScheduledAt,
        eq.Status,
        eq.Priority,
        eq.AttemptCount AS Attempts,
        eq.SentAt,
        eq.CancelledAt,
        eq.ErrorMessage,
        eq.CreatedAt,
        eq.BookingID,
        COALESCE(eq.Subject, et.Subject) AS Subject,
        eq.Variables
    FROM admin.EmailQueue eq
    LEFT JOIN admin.EmailTemplates et ON eq.TemplateKey = et.TemplateKey
    WHERE (@Status IS NULL OR eq.Status = @Status)
    ORDER BY eq.ScheduledAt DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) AS TotalCount FROM admin.EmailQueue WHERE (@Status IS NULL OR Status = @Status);
END
GO
