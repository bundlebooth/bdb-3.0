-- =============================================
-- Table: admin.EmailQueue
-- Description: Stores scheduled emails for queue processing
-- Created: 2026-01-20
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'EmailQueue' AND s.name = 'admin')
BEGIN
    CREATE TABLE admin.EmailQueue (
        QueueID INT IDENTITY(1,1) PRIMARY KEY,
        TemplateKey NVARCHAR(50) NOT NULL,
        RecipientEmail NVARCHAR(255) NOT NULL,
        RecipientName NVARCHAR(255) NULL,
        Variables NVARCHAR(MAX) NULL,
        ScheduledAt DATETIME2 NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        Priority INT NOT NULL DEFAULT 5,
        UserID INT NULL,
        BookingID INT NULL,
        EmailCategory NVARCHAR(50) NULL,
        Metadata NVARCHAR(MAX) NULL,
        SentAt DATETIME2 NULL,
        ErrorMessage NVARCHAR(MAX) NULL,
        RetryCount INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_EmailQueue_Status ON admin.EmailQueue(Status);
    CREATE INDEX IX_EmailQueue_ScheduledAt ON admin.EmailQueue(ScheduledAt);
    CREATE INDEX IX_EmailQueue_Priority ON admin.EmailQueue(Priority);
    
    PRINT 'Created table admin.EmailQueue';
END
GO
