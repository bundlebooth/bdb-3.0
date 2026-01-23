-- ============================================================
-- User Cookie Consent Table
-- For tracking cookie consent preferences
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserCookieConsent' AND schema_id = SCHEMA_ID('users'))
BEGIN
    CREATE TABLE users.UserCookieConsent (
        ConsentID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NULL,
        SessionID NVARCHAR(100) NULL,
        IPAddress NVARCHAR(50) NULL,
        NecessaryCookies BIT DEFAULT 1,
        AnalyticsCookies BIT DEFAULT 0,
        MarketingCookies BIT DEFAULT 0,
        FunctionalCookies BIT DEFAULT 1,
        ConsentGiven BIT DEFAULT 0,
        ConsentDate DATETIME2 DEFAULT GETDATE(),
        LastUpdated DATETIME2 DEFAULT GETDATE(),
        UserAgent NVARCHAR(500) NULL,
        CONSTRAINT FK_CookieConsent_User FOREIGN KEY (UserID) 
            REFERENCES users.Users(UserID) ON DELETE SET NULL
    );
    
    CREATE INDEX IX_CookieConsent_UserID ON users.UserCookieConsent(UserID);
    CREATE INDEX IX_CookieConsent_SessionID ON users.UserCookieConsent(SessionID);
END
GO
