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
	[Name] [nvarchar](100) NOT NULL,
	[Email] [nvarchar](100) NOT NULL,
	[PasswordHash] [nvarchar](255) NULL,
	[ProfileImageURL] [nvarchar](255) NULL,
	[Phone] [nvarchar](20) NULL,
	[Bio] [nvarchar](max) NULL,
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