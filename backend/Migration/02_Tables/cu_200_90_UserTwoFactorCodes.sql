-- =============================================
-- Table: users.UserTwoFactorCodes
-- Description: Stores two-factor authentication codes for users
-- Created: 2024-12-18
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'UserTwoFactorCodes' AND s.name = 'users')
BEGIN
    CREATE TABLE users.UserTwoFactorCodes (
        CodeID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        CodeHash NVARCHAR(255) NOT NULL,
        Purpose NVARCHAR(50) NOT NULL,
        ExpiresAt DATETIME NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        Attempts TINYINT NOT NULL DEFAULT 0,
        IsUsed BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_UserTwoFactorCodes_Users FOREIGN KEY (UserID) REFERENCES users.Users(UserID)
    );
    
    CREATE INDEX IX_UserTwoFactorCodes_UserID ON users.UserTwoFactorCodes(UserID);
    CREATE INDEX IX_UserTwoFactorCodes_ExpiresAt ON users.UserTwoFactorCodes(ExpiresAt);
    
    PRINT 'Created table users.UserTwoFactorCodes';
END
GO
