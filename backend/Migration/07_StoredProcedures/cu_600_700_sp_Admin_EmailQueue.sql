-- =============================================
-- Email Queue Stored Procedures
-- Description: Stored procedures for email queue management
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- Note: Table admin.EmailQueue is created in 02_Tables/cu_200_95_EmailQueue.sql
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- sp_QueueEmail
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_QueueEmail]'))
    DROP PROCEDURE [admin].[sp_QueueEmail];
GO

CREATE PROCEDURE [admin].[sp_QueueEmail]
    @TemplateKey NVARCHAR(50),
    @RecipientEmail NVARCHAR(255),
    @RecipientName NVARCHAR(255) = NULL,
    @Variables NVARCHAR(MAX) = NULL,
    @ScheduledAt DATETIME2,
    @Priority INT = 5,
    @UserID INT = NULL,
    @BookingID INT = NULL,
    @EmailCategory NVARCHAR(50) = NULL,
    @Metadata NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO admin.EmailQueue (TemplateKey, RecipientEmail, RecipientName, Variables, ScheduledAt, Priority, UserID, BookingID, EmailCategory, Metadata)
    VALUES (@TemplateKey, @RecipientEmail, @RecipientName, @Variables, @ScheduledAt, @Priority, @UserID, @BookingID, @EmailCategory, @Metadata);
    SELECT SCOPE_IDENTITY() AS QueueID;
END
GO

-- sp_GetPendingEmails
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPendingEmails]'))
    DROP PROCEDURE [admin].[sp_GetPendingEmails];
GO

CREATE PROCEDURE [admin].[sp_GetPendingEmails]
    @BatchSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@BatchSize) QueueID, TemplateKey, RecipientEmail, RecipientName, Variables, UserID, BookingID, EmailCategory, Metadata
    FROM admin.EmailQueue
    WHERE Status = 'pending' AND ScheduledAt <= GETUTCDATE()
    ORDER BY Priority ASC, ScheduledAt ASC;
END
GO

-- sp_MarkEmailSent
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_MarkEmailSent]'))
    DROP PROCEDURE [admin].[sp_MarkEmailSent];
GO

CREATE PROCEDURE [admin].[sp_MarkEmailSent]
    @QueueID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE admin.EmailQueue SET Status = 'sent', SentAt = GETUTCDATE(), UpdatedAt = GETUTCDATE() WHERE QueueID = @QueueID;
END
GO

-- sp_MarkEmailFailed
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_MarkEmailFailed]'))
    DROP PROCEDURE [admin].[sp_MarkEmailFailed];
GO

CREATE PROCEDURE [admin].[sp_MarkEmailFailed]
    @QueueID INT,
    @ErrorMessage NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE admin.EmailQueue SET Status = 'failed', ErrorMessage = @ErrorMessage, RetryCount = RetryCount + 1, UpdatedAt = GETUTCDATE() WHERE QueueID = @QueueID;
END
GO

-- sp_GetEmailQueueStats
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetEmailQueueStats]'))
    DROP PROCEDURE [admin].[sp_GetEmailQueueStats];
GO

CREATE PROCEDURE [admin].[sp_GetEmailQueueStats]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Status, COUNT(*) as Count FROM admin.EmailQueue GROUP BY Status;
END
GO

-- sp_GetEmailQueueItems
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetEmailQueueItems]'))
    DROP PROCEDURE [admin].[sp_GetEmailQueueItems];
GO

CREATE PROCEDURE [admin].[sp_GetEmailQueueItems]
    @Status NVARCHAR(20) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT QueueID, TemplateKey, RecipientEmail, RecipientName, Status, ScheduledAt, SentAt, ErrorMessage, Priority, EmailCategory, CreatedAt
    FROM admin.EmailQueue
    WHERE @Status IS NULL OR Status = @Status
    ORDER BY CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) as total FROM admin.EmailQueue WHERE @Status IS NULL OR Status = @Status;
END
GO

-- sp_CancelQueuedEmail
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_CancelQueuedEmail]'))
    DROP PROCEDURE [admin].[sp_CancelQueuedEmail];
GO

CREATE PROCEDURE [admin].[sp_CancelQueuedEmail]
    @QueueID INT,
    @Reason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE admin.EmailQueue SET Status = 'cancelled', ErrorMessage = @Reason, UpdatedAt = GETUTCDATE() WHERE QueueID = @QueueID AND Status = 'pending';
    SELECT @@ROWCOUNT as AffectedRows;
END
GO
