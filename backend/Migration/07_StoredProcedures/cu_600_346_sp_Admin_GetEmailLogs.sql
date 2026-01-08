-- =============================================
-- Stored Procedure: admin.sp_GetEmailLogs
-- Description: Gets email send logs with filters
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetEmailLogs]'))
    DROP PROCEDURE [admin].[sp_GetEmailLogs];
GO

CREATE PROCEDURE [admin].[sp_GetEmailLogs]
    @TemplateKey NVARCHAR(100) = NULL,
    @Status NVARCHAR(50) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        EmailLogID as id,
        TemplateKey as templateKey,
        RecipientEmail as recipientEmail,
        RecipientName as recipientName,
        Subject as subject,
        Status as status,
        ErrorMessage as errorMessage,
        SentAt as sentAt,
        UserID as userId,
        BookingID as bookingId
    FROM EmailLogs
    WHERE (@TemplateKey IS NULL OR TemplateKey = @TemplateKey)
        AND (@Status IS NULL OR Status = @Status)
    ORDER BY SentAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) as total 
    FROM EmailLogs
    WHERE (@TemplateKey IS NULL OR TemplateKey = @TemplateKey)
        AND (@Status IS NULL OR Status = @Status);
END
GO
