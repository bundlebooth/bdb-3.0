/*
    Migration Script: Create Table [UserTwoFactorCodes]
    Phase: 100 - Tables
    Script: cu_100_15_dbo.UserTwoFactorCodes.sql
    Description: Creates the [dbo].[UserTwoFactorCodes] table
    
    Execution Order: 15
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[UserTwoFactorCodes]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserTwoFactorCodes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[UserTwoFactorCodes](
	[CodeID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NOT NULL,
	[CodeHash] [nvarchar](255) NOT NULL,
	[Purpose] [nvarchar](50) NOT NULL,
	[ExpiresAt] [datetime] NOT NULL,
	[CreatedAt] [datetime] NOT NULL,
	[Attempts] [tinyint] NOT NULL,
	[IsUsed] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[CodeID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[UserTwoFactorCodes] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[UserTwoFactorCodes] already exists. Skipping.';
END
GO
