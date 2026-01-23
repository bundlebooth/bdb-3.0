/*
    Migration Script: Create Table [PushSubscriptions]
    Phase: 100 - Tables
    Description: Creates the [users].[PushSubscriptions] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[PushSubscriptions]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[PushSubscriptions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[PushSubscriptions](
	[SubscriptionID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NOT NULL,
	[Endpoint] [nvarchar](500) NOT NULL,
	[Subscription] [nvarchar](max) NOT NULL,
	[CreatedAt] [datetime] NULL CONSTRAINT [DF__PushSubsc__Creat__2BB470E3] DEFAULT (getdate()),
	[UpdatedAt] [datetime] NULL CONSTRAINT [DF__PushSubsc__Updat__2CA8951C] DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[SubscriptionID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [users].[PushSubscriptions] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[PushSubscriptions] already exists. Skipping.';
END
GO
