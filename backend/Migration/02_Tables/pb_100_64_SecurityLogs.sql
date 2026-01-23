-- =============================================
-- Table: users.SecurityLogs
-- Description: Stores security-related events (logins, failed attempts, etc.)
-- Created: 2024-12-18
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'SecurityLogs' AND s.name = 'users')
BEGIN
    CREATE TABLE users.SecurityLogs (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NULL,
        Email NVARCHAR(255) NULL,
        Action NVARCHAR(100) NOT NULL,
        ActionStatus NVARCHAR(50) NOT NULL,
        IPAddress NVARCHAR(50) NULL,
        UserAgent NVARCHAR(500) NULL,
        Location NVARCHAR(255) NULL,
        Device NVARCHAR(255) NULL,
        Details NVARCHAR(MAX) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_SecurityLogs_Users FOREIGN KEY (UserID) REFERENCES users.Users(UserID)
    );
    
    CREATE INDEX IX_SecurityLogs_UserID ON users.SecurityLogs(UserID);
    CREATE INDEX IX_SecurityLogs_Email ON users.SecurityLogs(Email);
    CREATE INDEX IX_SecurityLogs_Action ON users.SecurityLogs(Action);
    CREATE INDEX IX_SecurityLogs_CreatedAt ON users.SecurityLogs(CreatedAt DESC);
    
    PRINT 'Created table users.SecurityLogs';
END
GO
