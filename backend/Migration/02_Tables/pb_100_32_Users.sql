/*
    Migration Script: Create Table [Users]
    Phase: 100 - Tables
    Script: cu_100_01_Users.sql
    Description: Creates the [users].[Users] table
    Schema: users
    
    Execution Order: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[Users]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[Users](
	[UserID] [int] IDENTITY(1,1) NOT NULL,
	[FirstName] [nvarchar](100) NOT NULL,
	[Email] [nvarchar](100) NOT NULL,
	[PasswordHash] [nvarchar](255) NULL,
	[ProfileImageURL] [nvarchar](255) CONSTRAINT DF_Users_ProfileImageURL DEFAULT '' NULL,
	[Phone] [nvarchar](20) CONSTRAINT DF_Users_Phone DEFAULT '' NULL,
	[Bio] [nvarchar](max) CONSTRAINT DF_Users_Bio DEFAULT '' NULL,
	[IsVendor] [bit] NULL,
	[IsAdmin] [bit] NULL,
	[EmailVerified] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[LastLogin] [datetime] NULL,
	[AuthProvider] [nvarchar](20) NULL,
	[StripeCustomerID] [nvarchar](100) NULL,
	[NotificationPreferences] [nvarchar](max) NULL,
	[IsActive] [bit] NULL,
	-- Login security columns
	[FailedLoginAttempts] [int] NOT NULL CONSTRAINT DF_Users_FailedLoginAttempts DEFAULT 0,
	[LastFailedLoginAt] [datetime] NULL,
	[IsLocked] [bit] NOT NULL CONSTRAINT DF_Users_IsLocked DEFAULT 0,
	[LockExpiresAt] [datetime] NULL,
	[LockReason] [nvarchar](500) NULL,
	[PasswordResetRequired] [bit] NOT NULL CONSTRAINT DF_Users_PasswordResetRequired DEFAULT 0,
	[DeactivatedAt] [datetime] NULL,
	[DeactivationReason] [nvarchar](500) NULL,
	-- Last name field
	[LastName] [nvarchar](100) NULL,
	-- Soft delete columns
	[IsDeleted] [bit] NOT NULL CONSTRAINT DF_Users_IsDeleted DEFAULT 0,
	[DeletedAt] [datetime] NULL,
	[DeletedReason] [nvarchar](500) NULL,
	[LastActiveAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [users].[Users] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[Users] already exists. Skipping.';
END
GO