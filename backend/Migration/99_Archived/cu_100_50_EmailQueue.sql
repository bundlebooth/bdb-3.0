/*
    Migration Script: Table - [admin].[EmailQueue]
    Phase: 100 - Tables
    Description: Creates the EmailQueue table for scheduled email management
*/

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'admin.EmailQueue') AND type = 'U')
BEGIN
    CREATE TABLE admin.EmailQueue (
        QueueID INT IDENTITY(1,1) PRIMARY KEY,
        TemplateKey NVARCHAR(50) NOT NULL,
        RecipientEmail NVARCHAR(255) NOT NULL,
        RecipientName NVARCHAR(255) NULL,
        Variables NVARCHAR(MAX) NULL,
        Subject NVARCHAR(500) NULL,
        ScheduledAt DATETIME2 NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        Priority INT NOT NULL DEFAULT 5,
        UserID INT NULL,
        BookingID INT NULL,
        EmailCategory NVARCHAR(50) NULL,
        Metadata NVARCHAR(MAX) NULL,
        AttemptCount INT NOT NULL DEFAULT 0,
        LastAttemptAt DATETIME2 NULL,
        SentAt DATETIME2 NULL,
        CancelledAt DATETIME2 NULL,
        CancelledBy INT NULL,
        CancelReason NVARCHAR(500) NULL,
        ErrorMessage NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_EmailQueue_User FOREIGN KEY (UserID) REFERENCES users.Users(UserID),
        CONSTRAINT FK_EmailQueue_Booking FOREIGN KEY (BookingID) REFERENCES bookings.Bookings(BookingID),
        CONSTRAINT CK_EmailQueue_Status CHECK (Status IN ('pending', 'processing', 'sent', 'failed', 'cancelled'))
    );
    
    CREATE INDEX IX_EmailQueue_ScheduledAt ON admin.EmailQueue(ScheduledAt) WHERE Status = 'pending';
    CREATE INDEX IX_EmailQueue_Status ON admin.EmailQueue(Status);
    CREATE INDEX IX_EmailQueue_UserID ON admin.EmailQueue(UserID) WHERE UserID IS NOT NULL;
    CREATE INDEX IX_EmailQueue_BookingID ON admin.EmailQueue(BookingID) WHERE BookingID IS NOT NULL;
    
    PRINT 'Created table admin.EmailQueue';
END
GO
