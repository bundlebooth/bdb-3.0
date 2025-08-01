-- Section 1: User Management Tables

-- UserRoles table
CREATE TABLE UserRoles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_UserRoles_RoleName UNIQUE (RoleName)
);
GO
-- Users table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL,
    EmailConfirmed BIT NOT NULL DEFAULT 0,
    PasswordHash NVARCHAR(255) NULL,
    PasswordSalt NVARCHAR(255) NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20) NULL,
    PhoneNumberConfirmed BIT NOT NULL DEFAULT 0,
    AvatarURL NVARCHAR(255) NULL,
    DateOfBirth DATE NULL,
    LastLoginDate DATETIME NULL,
    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    IsLockedOut BIT NOT NULL DEFAULT 0,
    LockoutEndDate DATETIME NULL,
    TwoFactorEnabled BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);
GO
-- UserRoles mapping table
CREATE TABLE UserRoleMappings (
    MappingID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_UserRoleMappings_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_UserRoleMappings_RoleID FOREIGN KEY (RoleID) REFERENCES UserRoles(RoleID),
    CONSTRAINT UQ_UserRoleMappings_UserRole UNIQUE (UserID, RoleID)
);
GO
-- UserSessions table
CREATE TABLE UserSessions (
    SessionID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserID INT NOT NULL,
    SessionToken NVARCHAR(255) NOT NULL,
    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(255) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ExpiryDate DATETIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    LastActivityDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_UserSessions_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
-- SocialLoginProviders table
CREATE TABLE SocialLoginProviders (
    ProviderID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderName NVARCHAR(50) NOT NULL,
    ClientID NVARCHAR(255) NOT NULL,
    ClientSecret NVARCHAR(255) NOT NULL,
    AuthorizationEndpoint NVARCHAR(255) NOT NULL,
    TokenEndpoint NVARCHAR(255) NOT NULL,
    UserInfoEndpoint NVARCHAR(255) NOT NULL,
    Scope NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_SocialLoginProviders_ProviderName UNIQUE (ProviderName)
);
GO
-- UserSocialLogins table
CREATE TABLE UserSocialLogins (
    UserSocialLoginID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ProviderID INT NOT NULL,
    ProviderKey NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NULL,
    FirstName NVARCHAR(100) NULL,
    LastName NVARCHAR(100) NULL,
    ProfilePictureURL NVARCHAR(255) NULL,
    AccessToken NVARCHAR(MAX) NULL,
    RefreshToken NVARCHAR(MAX) NULL,
    TokenExpiration DATETIME NULL,
    DateLinked DATETIME NOT NULL DEFAULT GETDATE(),
    LastLoginDate DATETIME NULL,
    CONSTRAINT FK_UserSocialLogins_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_UserSocialLogins_ProviderID FOREIGN KEY (ProviderID) REFERENCES SocialLoginProviders(ProviderID),
    CONSTRAINT UQ_UserSocialLogins_ProviderKey UNIQUE (ProviderID, ProviderKey)
);
GO
-- UserPreferences table
CREATE TABLE UserPreferences (
    PreferenceID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    NotificationPrefs NVARCHAR(MAX) NULL,
    CommunicationPrefs NVARCHAR(MAX) NULL,
    ThemePrefs NVARCHAR(50) NULL DEFAULT 'light',
    LanguagePref NVARCHAR(10) NULL DEFAULT 'en-US',
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_UserPreferences_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT UQ_UserPreferences_UserID UNIQUE (UserID)
);
GO
