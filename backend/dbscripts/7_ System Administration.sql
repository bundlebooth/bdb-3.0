-- Section 7: System Administration

-- SystemSettings table
CREATE TABLE SystemSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) NOT NULL,
    SettingValue NVARCHAR(MAX) NULL,
    Description NVARCHAR(255) NULL,
    IsPublic BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_SystemSettings_SettingKey UNIQUE (SettingKey)
);
GO
-- AuditLogs table
CREATE TABLE AuditLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    ActionType NVARCHAR(50) NOT NULL,
    TableName NVARCHAR(100) NOT NULL,
    RecordID NVARCHAR(100) NOT NULL,
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    IPAddress NVARCHAR(45) NULL,
    ActionDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_AuditLogs_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
-- ErrorLogs table
CREATE TABLE ErrorLogs (
    ErrorID INT IDENTITY(1,1) PRIMARY KEY,
    ErrorTime DATETIME NOT NULL DEFAULT GETDATE(),
    ErrorMessage NVARCHAR(MAX) NOT NULL,
    ErrorType NVARCHAR(255) NOT NULL,
    ErrorSource NVARCHAR(255) NULL,
    StackTrace NVARCHAR(MAX) NULL,
    InnerException NVARCHAR(MAX) NULL,
    UserID INT NULL,
    IPAddress NVARCHAR(45) NULL,
    CONSTRAINT FK_ErrorLogs_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
-- EmailTemplates table
CREATE TABLE EmailTemplates (
    TemplateID INT IDENTITY(1,1) PRIMARY KEY,
    TemplateName NVARCHAR(100) NOT NULL,
    Subject NVARCHAR(255) NOT NULL,
    Body NVARCHAR(MAX) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_EmailTemplates_TemplateName UNIQUE (TemplateName)
);
GO
-- SentEmails table
CREATE TABLE SentEmails (
    EmailID INT IDENTITY(1,1) PRIMARY KEY,
    TemplateID INT NULL,
    RecipientEmail NVARCHAR(255) NOT NULL,
    Subject NVARCHAR(255) NOT NULL,
    Body NVARCHAR(MAX) NOT NULL,
    SentDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL, -- Sent, Delivered, Failed
    ErrorMessage NVARCHAR(MAX) NULL,
    CONSTRAINT FK_SentEmails_TemplateID FOREIGN KEY (TemplateID) REFERENCES EmailTemplates(TemplateID)
);
GO
-- MaintenanceWindows table
CREATE TABLE MaintenanceWindows (
    WindowID INT IDENTITY(1,1) PRIMARY KEY,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT CK_MaintenanceWindows_TimeRange CHECK (EndTime > StartTime)
);
GO
