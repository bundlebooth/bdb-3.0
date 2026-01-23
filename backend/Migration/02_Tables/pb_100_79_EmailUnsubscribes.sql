-- ============================================================
-- Email Unsubscribes Table
-- For tracking email unsubscribe preferences
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmailUnsubscribes' AND schema_id = SCHEMA_ID('users'))
BEGIN
    CREATE TABLE users.EmailUnsubscribes (
        UnsubscribeID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NULL,
        Email NVARCHAR(255) NOT NULL,
        Category NVARCHAR(50) NOT NULL, -- bookingConfirmations, bookingReminders, messages, payments, promotions, newsletter, all
        UnsubscribedAt DATETIME2 DEFAULT GETDATE(),
        ResubscribedAt DATETIME2 NULL,
        IsActive BIT DEFAULT 1,
        UnsubscribeToken NVARCHAR(100) NULL,
        IPAddress NVARCHAR(50) NULL,
        CONSTRAINT FK_EmailUnsubscribes_User FOREIGN KEY (UserID) 
            REFERENCES users.Users(UserID) ON DELETE SET NULL
    );
    
    CREATE INDEX IX_EmailUnsubscribes_Email ON users.EmailUnsubscribes(Email);
    CREATE INDEX IX_EmailUnsubscribes_UserID ON users.EmailUnsubscribes(UserID);
    CREATE INDEX IX_EmailUnsubscribes_Category ON users.EmailUnsubscribes(Category);
END
GO
