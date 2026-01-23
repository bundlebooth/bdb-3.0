/*
    Migration Script: Create Table [SecuritySettings]
    Phase: 100 - Tables
    Description: Creates the [users].[SecuritySettings] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[SecuritySettings]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[SecuritySettings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[SecuritySettings](
	[SettingID] [int] IDENTITY(1,1) NOT NULL,
	[Require2FAForAdmins] [bit] NOT NULL CONSTRAINT [DF__SecurityS__Requi__30792600] DEFAULT ((0)),
	[Require2FAForVendors] [bit] NOT NULL CONSTRAINT [DF__SecurityS__Requi__2F8501C7] DEFAULT ((0)),
	[SessionTimeout] [int] NOT NULL CONSTRAINT [DF__SecurityS__Sessi__335592AB] DEFAULT ((30)),
	[FailedLoginLockout] [int] NOT NULL CONSTRAINT [DF__SecurityS__Faile__32616E72] DEFAULT ((5)),
	[UpdatedAt] [datetime] NOT NULL CONSTRAINT [DF__SecurityS__Updat__316D4A39] DEFAULT (getdate()),
	[UpdatedBy] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[SettingID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [users].[SecuritySettings] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[SecuritySettings] already exists. Skipping.';
END
GO
