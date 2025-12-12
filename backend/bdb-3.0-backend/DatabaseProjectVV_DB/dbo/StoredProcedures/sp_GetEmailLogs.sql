
-- Get email logs with filters
CREATE   PROCEDURE sp_GetEmailLogs
    @TemplateKey NVARCHAR(50) = NULL, @RecipientEmail NVARCHAR(255) = NULL, @Status NVARCHAR(20) = NULL,
    @UserID INT = NULL, @StartDate DATETIME = NULL, @EndDate DATETIME = NULL, @PageNumber INT = 1, @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    SELECT EmailLogID, TemplateKey, RecipientEmail, RecipientName, Subject, Status, ErrorMessage, UserID, BookingID, Metadata, SentAt
    FROM EmailLogs
    WHERE (@TemplateKey IS NULL OR TemplateKey = @TemplateKey) AND (@RecipientEmail IS NULL OR RecipientEmail = @RecipientEmail)
      AND (@Status IS NULL OR Status = @Status) AND (@UserID IS NULL OR UserID = @UserID)
      AND (@StartDate IS NULL OR SentAt >= @StartDate) AND (@EndDate IS NULL OR SentAt <= @EndDate)
    ORDER BY SentAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    SELECT COUNT(*) AS TotalCount FROM EmailLogs
    WHERE (@TemplateKey IS NULL OR TemplateKey = @TemplateKey) AND (@RecipientEmail IS NULL OR RecipientEmail = @RecipientEmail)
      AND (@Status IS NULL OR Status = @Status) AND (@UserID IS NULL OR UserID = @UserID)
      AND (@StartDate IS NULL OR SentAt >= @StartDate) AND (@EndDate IS NULL OR SentAt <= @EndDate);
END

GO

