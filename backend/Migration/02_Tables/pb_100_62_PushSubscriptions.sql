-- =============================================
-- Table: users.PushSubscriptions
-- Description: Stores browser push notification subscriptions for users
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'users.PushSubscriptions') AND type in (N'U'))
BEGIN
    CREATE TABLE users.PushSubscriptions (
        SubscriptionID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        Endpoint NVARCHAR(500) NOT NULL,
        P256dhKey NVARCHAR(500) NULL,
        AuthKey NVARCHAR(500) NULL,
        Subscription NVARCHAR(MAX) NOT NULL,
        DeviceName NVARCHAR(255) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_PushSubscriptions_Users FOREIGN KEY (UserID) REFERENCES users.Users(UserID) ON DELETE CASCADE,
        CONSTRAINT UQ_PushSubscriptions_User_Endpoint UNIQUE (UserID, Endpoint)
    );
    
    CREATE INDEX IX_PushSubscriptions_UserID ON users.PushSubscriptions(UserID);
    CREATE INDEX IX_PushSubscriptions_IsActive ON users.PushSubscriptions(IsActive);
    
    PRINT 'Table users.PushSubscriptions created successfully';
END
ELSE
BEGIN
    PRINT 'Table users.PushSubscriptions already exists';
END
GO
