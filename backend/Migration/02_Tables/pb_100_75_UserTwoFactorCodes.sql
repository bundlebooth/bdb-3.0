/*
    Migration Script: Create Table [UserTwoFactorCodes]
    Phase: 100 - Tables
    Description: Creates the [users].[UserTwoFactorCodes] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[UserTwoFactorCodes]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[UserTwoFactorCodes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[UserTwoFactorCodes](
	[CodeID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NOT NULL,
	[CodeHash] [nvarchar](255) NOT NULL,
	[Purpose] [nvarchar](50) NOT NULL,
	[ExpiresAt] [datetime] NOT NULL,
	[CreatedAt] [datetime] NOT NULL CONSTRAINT [DF__UserTwoFa__Creat__4668671F] DEFAULT (getdate()),
	[Attempts] [tinyint] NOT NULL CONSTRAINT [DF__UserTwoFa__Attem__475C8B58] DEFAULT ((0)),
	[IsUsed] [bit] NOT NULL CONSTRAINT [DF__UserTwoFa__IsUse__4850AF91] DEFAULT ((0)),
PRIMARY KEY CLUSTERED 
(
	[CodeID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [users].[UserTwoFactorCodes] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[UserTwoFactorCodes] already exists. Skipping.';
END
GO
