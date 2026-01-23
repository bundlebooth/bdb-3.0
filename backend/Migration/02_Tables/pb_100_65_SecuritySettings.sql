-- =============================================
-- Table: users.SecuritySettings
-- Description: Stores platform-wide security settings (2FA requirements, lockout policies)
-- Created: 2024-12-18
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'SecuritySettings' AND s.name = 'users')
BEGIN
    CREATE TABLE users.SecuritySettings (
        SettingID INT IDENTITY(1,1) PRIMARY KEY,
        Require2FAForAdmins BIT NOT NULL DEFAULT 0,
        Require2FAForVendors BIT NOT NULL DEFAULT 0,
        SessionTimeout INT NOT NULL DEFAULT 30,
        FailedLoginLockout INT NOT NULL DEFAULT 5,
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedBy INT NULL
    );
    
    -- Insert default settings
    INSERT INTO users.SecuritySettings (Require2FAForAdmins, Require2FAForVendors) 
    VALUES (0, 0);
    
    PRINT 'Created table users.SecuritySettings with default values';
END
GO
